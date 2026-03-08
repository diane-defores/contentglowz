import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { normalizeContentMetadata } from "@/lib/content-metadata";
import { getContentSourcesByUserId, getProjectById } from "@/lib/db/queries";
import { parseFrontmatter } from "@/lib/frontmatter";
import {
	type GitHubBatchFileUpdate,
	getOctokit,
	listRepoFilesRecursive,
	readFileContent,
	writeMultipleFileContents,
} from "@/lib/github";

const MAX_FILES_PER_SOURCE = 500;
const FRONTMATTER_START = "---\n";

type AuditMode = "audit" | "dry-run" | "autofix";
type CanonicalField =
	| "funnelStage"
	| "seoCluster"
	| "ctaType"
	| "contentStatus"
	| "targetKeyword"
	| "targetPersona";
type MetadataSourceKind = "frontmatter" | "typescript";

interface FrontmatterIssue {
	sourceId: string;
	sourceName: string;
	repo: string;
	branch: string;
	filePath: string;
	reasons: string[];
	current: Partial<Record<CanonicalField, string>>;
	suggested: Partial<Record<CanonicalField, string>>;
	metadataSource: MetadataSourceKind;
	fixed: boolean;
	commitSha?: string;
	error?: string;
}

interface PendingGroupedChange {
	owner: string;
	repo: string;
	branch: string;
	changesByPath: Map<
		string,
		{ update: GitHubBatchFileUpdate; issueIndexes: number[] }
	>;
}

const FIELD_RULES: Array<{
	field: CanonicalField;
	legacyKeys: string[];
	alwaysCanonical: boolean;
}> = [
	{ field: "funnelStage", legacyKeys: ["funnel_stage"], alwaysCanonical: true },
	{
		field: "seoCluster",
		legacyKeys: ["seo_cluster", "cluster"],
		alwaysCanonical: true,
	},
	{ field: "ctaType", legacyKeys: ["cta_type"], alwaysCanonical: true },
	{
		field: "contentStatus",
		legacyKeys: ["workflowStatus"],
		alwaysCanonical: true,
	},
	{
		field: "targetKeyword",
		legacyKeys: ["target_keyword"],
		alwaysCanonical: false,
	},
	{
		field: "targetPersona",
		legacyKeys: ["target_persona"],
		alwaysCanonical: false,
	},
];

function resolveExtensions(filePattern: string): string[] {
	switch (filePattern) {
		case "md":
			return [".md"];
		case "mdx":
			return [".mdx"];
		case "both":
			return [".md", ".mdx"];
		case "astro":
			return [".astro"];
		case "ts":
			return [".ts"];
		default:
			return [".md", ".mdx", ".astro", ".ts"];
	}
}

function isTsFile(filePath: string): boolean {
	return filePath.endsWith(".ts") || filePath.endsWith(".tsx");
}

function asString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: undefined;
}

function hasKey(input: Record<string, unknown>, key: string): boolean {
	return Object.hasOwn(input, key);
}

function formatFrontmatterScalar(value: string): string {
	return /^[a-z0-9-]+$/i.test(value) ? value : JSON.stringify(value);
}

function csvEscape(value: string): string {
	if (value.includes(",") || value.includes('"') || value.includes("\n")) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

function findFrontmatterParts(content: string): {
	hasFrontmatter: boolean;
	frontmatter: string;
	body: string;
} {
	const normalized = content.replace(/\r\n/g, "\n");
	const trimmed = normalized.trimStart();
	if (!trimmed.startsWith(FRONTMATTER_START)) {
		return { hasFrontmatter: false, frontmatter: "", body: normalized };
	}

	const closingIndex = trimmed.indexOf("\n---", FRONTMATTER_START.length);
	if (closingIndex === -1) {
		return { hasFrontmatter: false, frontmatter: "", body: normalized };
	}

	const frontmatter = trimmed.slice(FRONTMATTER_START.length, closingIndex);
	const body = trimmed.slice(closingIndex + 4).replace(/^\n/, "");

	return { hasFrontmatter: true, frontmatter, body };
}

function applyCanonicalFrontmatterFields(params: {
	content: string;
	suggested: Partial<Record<CanonicalField, string>>;
}): string {
	const { content, suggested } = params;
	const { hasFrontmatter, frontmatter, body } = findFrontmatterParts(content);

	const removableKeys = new Set<string>();
	for (const rule of FIELD_RULES) {
		removableKeys.add(rule.field);
		for (const legacy of rule.legacyKeys) {
			removableKeys.add(legacy);
		}
	}

	const cleanedLines = hasFrontmatter
		? frontmatter.split("\n").filter((line) => {
				const trimmed = line.trimStart();
				for (const key of removableKeys) {
					if (new RegExp(`^${key}\\s*:`).test(trimmed)) return false;
				}
				return true;
			})
		: [];

	for (const rule of FIELD_RULES) {
		const value = suggested[rule.field];
		if (value) {
			cleanedLines.push(`${rule.field}: ${formatFrontmatterScalar(value)}`);
		}
	}

	const frontmatterBlock = `${FRONTMATTER_START}${cleanedLines.join("\n")}\n---\n\n`;
	return `${frontmatterBlock}${hasFrontmatter ? body : content.trimStart()}`;
}

function detectLineEnding(content: string): "\n" | "\r\n" {
	return content.includes("\r\n") ? "\r\n" : "\n";
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findMatchingClosingBrace(
	content: string,
	openingBraceIndex: number,
): number | undefined {
	let depth = 0;
	let inSingle = false;
	let inDouble = false;
	let inTemplate = false;
	let inLineComment = false;
	let inBlockComment = false;
	let escaped = false;

	for (let index = openingBraceIndex; index < content.length; index += 1) {
		const char = content[index];
		const next = content[index + 1];

		if (inLineComment) {
			if (char === "\n") inLineComment = false;
			continue;
		}
		if (inBlockComment) {
			if (char === "*" && next === "/") {
				inBlockComment = false;
				index += 1;
			}
			continue;
		}

		if (inSingle) {
			if (escaped) {
				escaped = false;
			} else if (char === "\\") {
				escaped = true;
			} else if (char === "'") {
				inSingle = false;
			}
			continue;
		}
		if (inDouble) {
			if (escaped) {
				escaped = false;
			} else if (char === "\\") {
				escaped = true;
			} else if (char === '"') {
				inDouble = false;
			}
			continue;
		}
		if (inTemplate) {
			if (escaped) {
				escaped = false;
			} else if (char === "\\") {
				escaped = true;
			} else if (char === "`") {
				inTemplate = false;
			}
			continue;
		}

		if (char === "/" && next === "/") {
			inLineComment = true;
			index += 1;
			continue;
		}
		if (char === "/" && next === "*") {
			inBlockComment = true;
			index += 1;
			continue;
		}

		if (char === "'") {
			inSingle = true;
			continue;
		}
		if (char === '"') {
			inDouble = true;
			continue;
		}
		if (char === "`") {
			inTemplate = true;
			continue;
		}

		if (char === "{") {
			depth += 1;
			continue;
		}
		if (char === "}") {
			depth -= 1;
			if (depth === 0) {
				return index;
			}
		}
	}

	return undefined;
}

function buildSeoMetadataDeclaration(params: {
	suggested: Partial<Record<CanonicalField, string>>;
	preservedBody?: string;
	eol: "\n" | "\r\n";
}): string {
	const { suggested, preservedBody, eol } = params;
	const lines = ["export const seoMetadata = {"];

	for (const rule of FIELD_RULES) {
		const value = suggested[rule.field];
		if (!value) continue;
		lines.push(`  ${rule.field}: ${JSON.stringify(value)},`);
	}

	if (preservedBody && preservedBody.trim().length > 0) {
		lines.push(preservedBody.trim());
	}

	lines.push("} as const;");
	return `${lines.join(eol)}${eol}`;
}

function stripManagedTypeScriptMetadataEntries(params: {
	objectBody: string;
	eol: "\n" | "\r\n";
}): string {
	const { objectBody, eol } = params;
	const managedKeys = new Set<string>();
	for (const rule of FIELD_RULES) {
		managedKeys.add(rule.field);
		for (const legacy of rule.legacyKeys) {
			managedKeys.add(legacy);
		}
	}

	const keyPattern = Array.from(managedKeys).map(escapeRegExp).join("|");
	const entryPattern = new RegExp(
		`^\\s*(?:${keyPattern}|"(?:${keyPattern})"|'(?:${keyPattern})')\\s*:`,
	);

	const filtered = objectBody
		.split(/\r?\n/)
		.filter((line) => !entryPattern.test(line.trimStart()));

	return filtered.join(eol).trim();
}

function findInsertionIndexAfterImports(content: string): number {
	let index = 0;
	const triviaPattern = /(?:\s|\/\/[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)*/y;
	const directivePattern = /(?:["']use [^"']+["'];\s*)/y;
	const importBlockPattern = /import\s+[\s\S]*?;\s*/y;

	const consumeTrivia = () => {
		triviaPattern.lastIndex = index;
		const trivia = triviaPattern.exec(content);
		if (trivia) {
			index = triviaPattern.lastIndex;
		}
	};

	consumeTrivia();

	while (index < content.length) {
		directivePattern.lastIndex = index;
		const directive = directivePattern.exec(content);
		if (!directive || directive.index !== index) {
			break;
		}
		index = directivePattern.lastIndex;
		consumeTrivia();
	}

	while (index < content.length) {
		importBlockPattern.lastIndex = index;
		const importBlock = importBlockPattern.exec(content);
		if (!importBlock || importBlock.index !== index) {
			break;
		}
		index = importBlockPattern.lastIndex;
		consumeTrivia();
	}

	return index;
}

function applyCanonicalTypeScriptMetadataFields(params: {
	content: string;
	suggested: Partial<Record<CanonicalField, string>>;
}): string {
	const { content, suggested } = params;
	const eol = detectLineEnding(content);
	const declaration = buildSeoMetadataDeclaration({ suggested, eol });
	const seoMetadataPattern =
		/\bexport\s+const\s+seoMetadata(?:\s*:\s*[^=]+)?\s*=\s*\{/;
	const match = seoMetadataPattern.exec(content);

	if (match) {
		const openingBraceIndex = content.indexOf("{", match.index);
		if (openingBraceIndex === -1) {
			return content;
		}

		const closingBraceIndex = findMatchingClosingBrace(
			content,
			openingBraceIndex,
		);
		if (closingBraceIndex === undefined) {
			return content;
		}

		let endIndex = closingBraceIndex + 1;

		const asConstMatch = content.slice(endIndex).match(/^\s*as\s+const/);
		if (asConstMatch) {
			endIndex += asConstMatch[0].length;
		}

		const semicolonMatch = content.slice(endIndex).match(/^\s*;/);
		if (semicolonMatch) {
			endIndex += semicolonMatch[0].length;
		}

		const trailingNewlineMatch = content.slice(endIndex).match(/^\s*\r?\n/);
		if (trailingNewlineMatch) {
			endIndex += trailingNewlineMatch[0].length;
		}

		const existingBody = content.slice(
			openingBraceIndex + 1,
			closingBraceIndex,
		);
		const preservedBody = stripManagedTypeScriptMetadataEntries({
			objectBody: existingBody,
			eol,
		});
		const mergedDeclaration = buildSeoMetadataDeclaration({
			suggested,
			preservedBody,
			eol,
		});

		return `${content.slice(0, match.index)}${mergedDeclaration}${content.slice(endIndex)}`;
	}

	const insertionIndex = findInsertionIndexAfterImports(content);
	const before = content.slice(0, insertionIndex);
	const after = content.slice(insertionIndex);
	const needsLeadingEol = before.length > 0 && !before.endsWith(eol);
	const needsTrailingEol = after.length > 0 && !after.startsWith(eol);

	return `${before}${needsLeadingEol ? eol : ""}${declaration}${needsTrailingEol ? eol : ""}${after}`;
}

function buildCsvReport(issues: FrontmatterIssue[]): string {
	const headers = [
		"repo",
		"branch",
		"filePath",
		"metadataSource",
		"reasons",
		"suggested",
		"fixed",
		"commitSha",
		"error",
	];
	const lines = [headers.join(",")];

	for (const issue of issues) {
		const suggested = Object.entries(issue.suggested)
			.map(([k, v]) => `${k}=${v}`)
			.join("|");
		lines.push(
			[
				csvEscape(issue.repo),
				csvEscape(issue.branch),
				csvEscape(issue.filePath),
				csvEscape(issue.metadataSource),
				csvEscape(issue.reasons.join(" | ")),
				csvEscape(suggested),
				issue.fixed ? "yes" : "no",
				csvEscape(issue.commitSha ?? ""),
				csvEscape(issue.error ?? ""),
			].join(","),
		);
	}

	return lines.join("\n");
}

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json().catch(() => ({}));
		const projectId =
			typeof body.projectId === "string" ? body.projectId : undefined;
		const mode: AuditMode =
			body.mode === "autofix"
				? "autofix"
				: body.mode === "dry-run"
					? "dry-run"
					: "audit";
		const includeCsv = body.includeCsv === true;

		if (!projectId) {
			return NextResponse.json(
				{ error: "projectId is required" },
				{ status: 400 },
			);
		}

		const project = await getProjectById({ id: projectId });
		if (!project || project.userId !== userId) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}

		const octokit = await getOctokit(userId);
		if (!octokit) {
			return NextResponse.json(
				{ error: "GitHub not connected for this user" },
				{ status: 401 },
			);
		}

		const sources = await getContentSourcesByUserId({ userId, projectId });
		if (sources.length === 0) {
			return NextResponse.json({
				success: true,
				mode,
				projectId,
				sourcesProcessed: 0,
				filesScanned: 0,
				filesWithIssues: 0,
				filesWithFrontmatterIssues: 0,
				filesWithTypeScriptMetadataIssues: 0,
				filesFixed: 0,
				filesFixedFrontmatter: 0,
				filesFixedTypeScript: 0,
				filesSkippedNoMetadata: 0,
				groupedCommits: 0,
				issues: [],
				csv: includeCsv
					? "repo,branch,filePath,metadataSource,reasons,suggested,fixed,commitSha,error"
					: undefined,
			});
		}

		let filesScanned = 0;
		let filesWithIssues = 0;
		let filesWithFrontmatterIssues = 0;
		let filesWithTypeScriptMetadataIssues = 0;
		let filesFixed = 0;
		let filesFixedFrontmatter = 0;
		let filesFixedTypeScript = 0;
		let filesSkippedNoMetadata = 0;
		let groupedCommits = 0;
		const issues: FrontmatterIssue[] = [];
		const pendingByGroup = new Map<string, PendingGroupedChange>();

		for (const source of sources) {
			const filePaths = await listRepoFilesRecursive(
				octokit,
				source.repoOwner,
				source.repoName,
				{
					basePath: source.basePath,
					branch: source.defaultBranch,
					extensions: resolveExtensions(source.filePattern),
					limit: MAX_FILES_PER_SOURCE,
				},
			);

			for (const filePath of filePaths) {
				filesScanned += 1;

				try {
					const { content } = await readFileContent(
						octokit,
						source.repoOwner,
						source.repoName,
						filePath,
						source.defaultBranch,
					);
					const { metadata: rawMetadata, metadataSource } =
						parseFrontmatter(content);
					const isTypeScriptSourceFile = isTsFile(filePath);
					if (isTypeScriptSourceFile && metadataSource === "none") {
						// Count TS files missing explicit metadata. They are still audited and
						// can be autofixed by injecting a canonical `seoMetadata` block.
						filesSkippedNoMetadata += 1;
					}

					const fallbackTitle =
						filePath
							.split("/")
							.pop()
							?.replace(/\.[^.]+$/, "")
							.replace(/[-_]+/g, " ")
							.trim() || "Untitled";

					const normalized = normalizeContentMetadata({
						rawMetadata,
						title: fallbackTitle,
						tags: [],
						dashboardStatus: undefined,
					});

					const reasons: string[] = [];
					const current: Partial<Record<CanonicalField, string>> = {};
					const suggested: Partial<Record<CanonicalField, string>> = {};

					for (const rule of FIELD_RULES) {
						const rawCanonical = asString(rawMetadata[rule.field]);
						const canonicalValue = asString(normalized.metadata[rule.field]);
						const hasLegacy = rule.legacyKeys.some((legacy) =>
							hasKey(rawMetadata, legacy),
						);

						if (rawCanonical) current[rule.field] = rawCanonical;
						if (canonicalValue) suggested[rule.field] = canonicalValue;

						if (rule.alwaysCanonical) {
							if (!canonicalValue) continue;
							if (!rawCanonical) {
								reasons.push(`missing ${rule.field}`);
							} else if (rawCanonical !== canonicalValue) {
								reasons.push(
									`non-canonical ${rule.field} (${rawCanonical} -> ${canonicalValue})`,
								);
							}
							if (hasLegacy) {
								reasons.push(`legacy key for ${rule.field} detected`);
							}
						} else if (canonicalValue) {
							if (!rawCanonical && hasLegacy) {
								reasons.push(`missing ${rule.field} (legacy alias present)`);
							} else if (rawCanonical && rawCanonical !== canonicalValue) {
								reasons.push(
									`non-canonical ${rule.field} (${rawCanonical} -> ${canonicalValue})`,
								);
							} else if (!rawCanonical && !hasLegacy) {
								delete suggested[rule.field];
							}
						}
					}

					if (reasons.length === 0) {
						continue;
					}

					filesWithIssues += 1;
					const issueMetadataSource: MetadataSourceKind = isTypeScriptSourceFile
						? "typescript"
						: "frontmatter";
					if (issueMetadataSource === "typescript") {
						filesWithTypeScriptMetadataIssues += 1;
					} else {
						filesWithFrontmatterIssues += 1;
					}
					const issueIndex = issues.length;
					issues.push({
						sourceId: source.id,
						sourceName: source.name,
						repo: `${source.repoOwner}/${source.repoName}`,
						branch: source.defaultBranch,
						filePath,
						reasons,
						current,
						suggested,
						metadataSource: issueMetadataSource,
						fixed: false,
					});

					if (mode === "autofix") {
						const updatedContent =
							issueMetadataSource === "typescript"
								? applyCanonicalTypeScriptMetadataFields({
										content,
										suggested,
									})
								: applyCanonicalFrontmatterFields({
										content,
										suggested,
									});
						const groupKey = `${source.repoOwner}/${source.repoName}@${source.defaultBranch}`;
						const existingGroup = pendingByGroup.get(groupKey);
						const group = existingGroup ?? {
							owner: source.repoOwner,
							repo: source.repoName,
							branch: source.defaultBranch,
							changesByPath: new Map(),
						};

						const existingPathUpdate = group.changesByPath.get(filePath);
						if (existingPathUpdate) {
							existingPathUpdate.update.content = updatedContent;
							existingPathUpdate.issueIndexes.push(issueIndex);
						} else {
							group.changesByPath.set(filePath, {
								update: { path: filePath, content: updatedContent },
								issueIndexes: [issueIndex],
							});
						}
						pendingByGroup.set(groupKey, group);
					}
				} catch (error) {
					issues.push({
						sourceId: source.id,
						sourceName: source.name,
						repo: `${source.repoOwner}/${source.repoName}`,
						branch: source.defaultBranch,
						filePath,
						reasons: ["file processing failed"],
						current: {},
						suggested: {},
						metadataSource: "frontmatter",
						fixed: false,
						error: error instanceof Error ? error.message : String(error),
					});
				}
			}
		}

		if (mode === "autofix") {
			for (const group of pendingByGroup.values()) {
				const updates = Array.from(group.changesByPath.values());
				if (updates.length === 0) continue;

				try {
					const result = await writeMultipleFileContents(octokit, {
						owner: group.owner,
						repo: group.repo,
						branch: group.branch,
						message: `chore(metadata): normalize metadata fields in ${updates.length} file(s)`,
						files: updates.map((entry) => entry.update),
					});
					groupedCommits += 1;

					for (const entry of updates) {
						for (const issueIndex of entry.issueIndexes) {
							const issue = issues[issueIndex];
							if (!issue) continue;
							issue.fixed = true;
							issue.commitSha = result.commitSha;
							filesFixed += 1;
							if (issue.metadataSource === "typescript") {
								filesFixedTypeScript += 1;
							} else {
								filesFixedFrontmatter += 1;
							}
						}
					}
				} catch (error) {
					const errorText =
						error instanceof Error ? error.message : String(error);
					for (const entry of updates) {
						for (const issueIndex of entry.issueIndexes) {
							const issue = issues[issueIndex];
							if (!issue) continue;
							issue.error = errorText;
						}
					}
				}
			}
		}

		return NextResponse.json({
			success: true,
			mode,
			projectId,
			sourcesProcessed: sources.length,
			filesScanned,
			filesWithIssues,
			filesWithFrontmatterIssues,
			filesWithTypeScriptMetadataIssues,
			filesFixed,
			filesFixedFrontmatter,
			filesFixedTypeScript,
			filesSkippedNoMetadata,
			groupedCommits,
			issues,
			csv: includeCsv ? buildCsvReport(issues) : undefined,
		});
	} catch (error) {
		console.error("Metadata audit failed:", error);
		return NextResponse.json(
			{ error: "Failed to audit metadata" },
			{ status: 500 },
		);
	}
}
