export interface ParsedFrontmatter {
	metadata: Record<string, unknown>;
	body: string;
}

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

export function parseFrontmatter(content: string): ParsedFrontmatter {
	const trimmed = content.trimStart();
	if (!trimmed.startsWith("---\n")) {
		return { metadata: {}, body: content };
	}

	const closingIndex = trimmed.indexOf("\n---", 4);
	if (closingIndex === -1) {
		return { metadata: {}, body: content };
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

	return { metadata, body };
}
