export interface ParsedFrontmatter {
	metadata: Record<string, unknown>;
	body: string;
	hasFrontmatter: boolean;
	metadataSource: "frontmatter" | "typescript" | "none";
}

const TS_METADATA_KEYS = [
	"title",
	"description",
	"author",
	"tags",
	"pubDate",
	"updatedDate",
	"imgUrl",
	"metaTitle",
	"metaDescription",
	"canonicalUrl",
	"draft",
	"locale",
	"funnelStage",
	"funnel_stage",
	"seoCluster",
	"seo_cluster",
	"cluster",
	"targetPersona",
	"target_persona",
	"targetKeyword",
	"target_keyword",
	"ctaType",
	"cta_type",
	"contentStatus",
	"workflowStatus",
	"qualityStatus",
] as const;

const TS_METADATA_KEY_SET = new Set<string>(TS_METADATA_KEYS);

const TS_METADATA_CONTAINER_PATTERNS = [
	/\bexport\s+const\s+seoMetadata\s*=\s*\{/g,
	/\bseoMetadata\s*:\s*\{/g,
	/\bmetadata\s*:\s*\{/g,
	/\bexport\s+default\s*\{/g,
	/\bexport\s+const\s+[A-Za-z0-9_]+\s*=\s*\{/g,
] as const;

function parseScalar(raw: string): unknown {
	const value = raw.trim();
	if (!value) return "";

	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}

	if (value === "true") return true;
	if (value === "false") return false;
	if (/^-?\d+$/.test(value)) return Number.parseInt(value, 10);
	if (/^-?\d+\.\d+$/.test(value)) return Number.parseFloat(value);

	return value;
}

function normalizeMultiline(value: string): string {
	return value
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
		.join(" ");
}

function parseTypeScriptScalar(raw: string): unknown | undefined {
	const value = raw.trim();
	if (!value) return undefined;

	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'")) ||
		(value.startsWith("`") && value.endsWith("`"))
	) {
		return value.slice(1, -1);
	}

	if (value === "true") return true;
	if (value === "false") return false;
	if (/^-?\d+$/.test(value)) return Number.parseInt(value, 10);
	if (/^-?\d+\.\d+$/.test(value)) return Number.parseFloat(value);
	if (/^[a-z0-9_-]+$/i.test(value)) return value;

	return undefined;
}

function parseTypeScriptStringArray(raw: string): string[] | undefined {
	const value = raw.trim();
	if (!(value.startsWith("[") && value.endsWith("]"))) {
		return undefined;
	}

	const itemRegex =
		/"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|`([^`\\]*(?:\\.[^`\\]*)*)`/g;
	const entries: string[] = [];
	for (const match of value.matchAll(itemRegex)) {
		const parsed = (match[1] ?? match[2] ?? match[3] ?? "").trim();
		if (parsed.length > 0) {
			entries.push(parsed);
		}
	}

	return entries.length > 0 ? entries : undefined;
}

function readTypeScriptValueExpression(
	content: string,
	startIndex: number,
): string {
	let braceDepth = 0;
	let bracketDepth = 0;
	let parenDepth = 0;
	let inSingle = false;
	let inDouble = false;
	let inTemplate = false;
	let inLineComment = false;
	let inBlockComment = false;
	let escaped = false;

	for (let index = startIndex; index < content.length; index += 1) {
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
			braceDepth += 1;
			continue;
		}
		if (char === "}") {
			if (braceDepth === 0 && bracketDepth === 0 && parenDepth === 0) {
				return content.slice(startIndex, index).trim();
			}
			braceDepth = Math.max(0, braceDepth - 1);
			continue;
		}
		if (char === "[") {
			bracketDepth += 1;
			continue;
		}
		if (char === "]") {
			bracketDepth = Math.max(0, bracketDepth - 1);
			continue;
		}
		if (char === "(") {
			parenDepth += 1;
			continue;
		}
		if (char === ")") {
			parenDepth = Math.max(0, parenDepth - 1);
			continue;
		}

		if (
			(char === "," || char === "\n") &&
			braceDepth === 0 &&
			bracketDepth === 0 &&
			parenDepth === 0
		) {
			return content.slice(startIndex, index).trim();
		}
	}

	return content.slice(startIndex).trim();
}

function extractObjectLiteral(
	content: string,
	openingBraceIndex: number,
): string | undefined {
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
				return content.slice(openingBraceIndex + 1, index);
			}
		}
	}

	return undefined;
}

function parseTypeScriptMetadataObject(
	objectContent: string,
): Record<string, unknown> {
	const metadata: Record<string, unknown> = {};

	for (const key of TS_METADATA_KEYS) {
		const keyPattern = new RegExp(`\\b${key}\\s*:`, "g");
		let keyMatch = keyPattern.exec(objectContent);

		while (keyMatch) {
			const valueStart = keyMatch.index + keyMatch[0].length;
			const rawValue = readTypeScriptValueExpression(objectContent, valueStart);

			if (key === "tags") {
				const tags = parseTypeScriptStringArray(rawValue);
				if (tags) {
					metadata[key] = tags;
					break;
				}
			} else {
				const parsed = parseTypeScriptScalar(rawValue);
				if (parsed !== undefined) {
					metadata[key] = parsed;
					break;
				}
			}

			keyMatch = keyPattern.exec(objectContent);
		}
	}

	return metadata;
}

function parseTypeScriptMetadata(content: string): Record<string, unknown> {
	const normalized = content.replace(/\r\n/g, "\n");

	for (const pattern of TS_METADATA_CONTAINER_PATTERNS) {
		pattern.lastIndex = 0;
		let match = pattern.exec(normalized);
		while (match) {
			const openingBraceIndex = normalized.indexOf("{", match.index);
			if (openingBraceIndex !== -1) {
				const objectContent = extractObjectLiteral(
					normalized,
					openingBraceIndex,
				);
				if (objectContent) {
					const metadata = parseTypeScriptMetadataObject(objectContent);
					if (
						Object.keys(metadata).some((key) => TS_METADATA_KEY_SET.has(key))
					) {
						return metadata;
					}
				}
			}
			match = pattern.exec(normalized);
		}
	}

	return {};
}

export function parseFrontmatter(content: string): ParsedFrontmatter {
	const trimmed = content.trimStart();
	if (!trimmed.startsWith("---\n")) {
		const tsMetadata = parseTypeScriptMetadata(content);
		if (Object.keys(tsMetadata).length > 0) {
			return {
				metadata: tsMetadata,
				body: content,
				hasFrontmatter: false,
				metadataSource: "typescript",
			};
		}
		return {
			metadata: {},
			body: content,
			hasFrontmatter: false,
			metadataSource: "none",
		};
	}

	const closingIndex = trimmed.indexOf("\n---", 4);
	if (closingIndex === -1) {
		return {
			metadata: {},
			body: content,
			hasFrontmatter: false,
			metadataSource: "none",
		};
	}

	const rawFrontmatter = trimmed.slice(4, closingIndex).replace(/\r\n/g, "\n");
	const body = trimmed.slice(closingIndex + 4).replace(/^\n/, "");

	const metadata: Record<string, unknown> = {};
	const lines = rawFrontmatter.split("\n");

	let currentKey: string | null = null;
	let currentType: "array" | "text" | null = null;
	let textBuffer: string[] = [];

	const flushTextBuffer = () => {
		if (!currentKey || currentType !== "text") return;
		metadata[currentKey] = normalizeMultiline(textBuffer.join("\n"));
		textBuffer = [];
	};

	for (const rawLine of lines) {
		const line = rawLine.replace(/\t/g, "  ");

		if (/^\s*#/.test(line)) {
			continue;
		}

		const keyMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
		if (keyMatch) {
			flushTextBuffer();
			currentKey = keyMatch[1];
			const rest = keyMatch[2];

			if (rest === "") {
				currentType = "text";
				textBuffer = [];
				continue;
			}

			metadata[currentKey] = parseScalar(rest);
			currentType = null;
			continue;
		}

		const listMatch = line.match(/^\s*-\s+(.*)$/);
		if (listMatch && currentKey) {
			flushTextBuffer();
			if (!Array.isArray(metadata[currentKey])) {
				metadata[currentKey] = [];
			}
			(metadata[currentKey] as unknown[]).push(parseScalar(listMatch[1]));
			currentType = "array";
			continue;
		}

		if (currentKey && currentType === "text") {
			textBuffer.push(line.trim());
		}
	}

	flushTextBuffer();

	return {
		metadata,
		body,
		hasFrontmatter: true,
		metadataSource: "frontmatter",
	};
}
