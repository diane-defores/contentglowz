import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { normalizeContentMetadata } from "@/lib/content-metadata";
import {
	getContentSourceById,
	getContentSourcesByUserId,
	updateContentSource,
	upsertContentRecord,
} from "@/lib/db/queries";
import { parseFrontmatter } from "@/lib/frontmatter";
import {
	getOctokit,
	listRepoFilesRecursive,
	readFileContent,
} from "@/lib/github";

const MAX_FILES_PER_SOURCE = 500;

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

function mapWorkflowStatusToRecordStatus(
	workflowStatus: string,
):
	| "todo"
	| "pending_review"
	| "approved"
	| "scheduled"
	| "published"
	| "archived" {
	switch (workflowStatus) {
		case "in_review":
			return "pending_review";
		case "approved":
			return "approved";
		case "scheduled":
			return "scheduled";
		case "published":
			return "published";
		case "archived":
			return "archived";
		default:
			return "todo";
	}
}

function buildRecordId(sourceId: string, filePath: string): string {
	return `source:${sourceId}:${Buffer.from(filePath).toString("base64url")}`;
}

export async function POST(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json().catch(() => ({}));
		const projectId =
			typeof body.projectId === "string" ? body.projectId : undefined;
		const sourceId =
			typeof body.sourceId === "string" ? body.sourceId : undefined;

		const octokit = await getOctokit(userId);
		if (!octokit) {
			return NextResponse.json(
				{ error: "GitHub not connected. Please connect GitHub first." },
				{ status: 401 },
			);
		}

		const sources = sourceId
			? [await getContentSourceById({ id: sourceId })].filter(
					(entry): entry is NonNullable<typeof entry> =>
						Boolean(entry) && entry.userId === userId,
				)
			: await getContentSourcesByUserId({ userId, projectId });

		if (sources.length === 0) {
			return NextResponse.json({
				success: true,
				sourcesProcessed: 0,
				recordsUpserted: 0,
				filesScanned: 0,
				errors: ["No matching content sources found"],
			});
		}

		let totalRecordsUpserted = 0;
		let totalFilesScanned = 0;
		const errors: string[] = [];
		const sourceSummaries: Array<{
			sourceId: string;
			name: string;
			filesScanned: number;
			recordsUpserted: number;
			errors: string[];
		}> = [];

		for (const source of sources) {
			const sourceErrors: string[] = [];
			let sourceFilesScanned = 0;
			let sourceRecordsUpserted = 0;

			try {
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
					sourceFilesScanned += 1;
					try {
						const { content } = await readFileContent(
							octokit,
							source.repoOwner,
							source.repoName,
							filePath,
							source.defaultBranch,
						);
						const {
							metadata: rawMetadata,
							body: markdownBody,
							metadataSource,
						} = parseFrontmatter(content);
						if (isTsFile(filePath) && metadataSource === "none") {
							continue;
						}
						const fallbackTitle = filePath
							.split("/")
							.pop()
							?.replace(/\.[^.]+$/, "")
							.replace(/[-_]+/g, " ")
							.trim();
						const normalized = normalizeContentMetadata({
							rawMetadata,
							title: fallbackTitle || "Untitled",
							tags: [],
							dashboardStatus: undefined,
						});

						const recordStatus = mapWorkflowStatusToRecordStatus(
							normalized.metadata.contentStatus,
						);
						const recordId = buildRecordId(source.id, filePath);

						await upsertContentRecord({
							id: recordId,
							title: normalized.metadata.title,
							contentType: "article",
							sourceRobot: "article",
							status: recordStatus,
							projectId: source.projectId,
							contentPath: filePath,
							contentPreview: markdownBody.slice(0, 300),
							tags: normalized.metadata.tags,
							metadata: normalized.metadata,
							syncedAt: new Date(),
						});

						sourceRecordsUpserted += 1;
					} catch (error) {
						sourceErrors.push(
							`Failed file ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
						);
					}
				}

				await updateContentSource({
					id: source.id,
					lastSyncedAt: new Date(),
					status: sourceErrors.length > 0 ? "error" : "active",
					metadata: {
						...(source.metadata || {}),
						fileCount: sourceFilesScanned,
						description:
							sourceErrors.length > 0
								? `Synced with ${sourceErrors.length} errors`
								: "Sync complete",
					},
				});
			} catch (error) {
				sourceErrors.push(
					`Source sync failed: ${error instanceof Error ? error.message : String(error)}`,
				);
			}

			totalFilesScanned += sourceFilesScanned;
			totalRecordsUpserted += sourceRecordsUpserted;
			errors.push(...sourceErrors);
			sourceSummaries.push({
				sourceId: source.id,
				name: source.name,
				filesScanned: sourceFilesScanned,
				recordsUpserted: sourceRecordsUpserted,
				errors: sourceErrors,
			});
		}

		return NextResponse.json({
			success: true,
			sourcesProcessed: sources.length,
			recordsUpserted: totalRecordsUpserted,
			filesScanned: totalFilesScanned,
			errors,
			sources: sourceSummaries,
		});
	} catch (error) {
		console.error("Failed to sync content metadata:", error);
		return NextResponse.json(
			{ error: "Failed to sync content metadata" },
			{ status: 500 },
		);
	}
}
