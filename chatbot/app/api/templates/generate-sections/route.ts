/**
 * Generate Sections API Route (Step 1)
 *
 * Reads sample files from a GitHub repo via Octokit,
 * then uses AI to suggest template sections based on content structure.
 * Returns a streamed text response with sections in <SECTIONS>...</SECTIONS> tags.
 */
import { streamText } from "ai";
import { auth } from "@clerk/nextjs/server";
import { createResearchProvider } from "@/lib/ai/research-provider";
import {
	getOctokit,
	listRepoContents,
	filterContentEntries,
	readFileContent,
} from "@/lib/github";
import { getUserSettings } from "@/lib/db/queries";

export const maxDuration = 60;

export async function POST(request: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const {
			templateName,
			contentType,
			repoOwner,
			repoName,
			basePath,
			filePattern,
			filePaths,
		} = body as {
			templateName: string;
			contentType: string;
			repoOwner: string;
			repoName: string;
			basePath: string;
			filePattern: string;
			filePaths?: string[];
		};

		if (!repoOwner || !repoName) {
			return Response.json(
				{ error: "Missing repoOwner or repoName" },
				{ status: 400 },
			);
		}

		// Get OpenRouter API key
		const settings = await getUserSettings({ userId });
		const apiKeys = settings.apiKeys || {};
		if (!apiKeys.openrouter) {
			return Response.json(
				{
					error:
						"OpenRouter API key not configured. Add it in Settings > API Keys.",
				},
				{ status: 400 },
			);
		}

		// Get Octokit for GitHub access
		const octokit = await getOctokit(userId);
		if (!octokit) {
			return Response.json(
				{
					error:
						"GitHub not connected. Connect GitHub in your Clerk account settings.",
				},
				{ status: 400 },
			);
		}

		// List files in the base path
		const entries = await listRepoContents(
			octokit,
			repoOwner,
			repoName,
			basePath || "",
		);
		const contentFiles = filterContentEntries(entries).filter(
			(e) => e.type === "file",
		);

		// Filter by file pattern
		const matchingFiles = contentFiles.filter((f) => {
			if (!filePattern || filePattern === "all") return true;
			if (filePattern === "md") return f.name.endsWith(".md");
			if (filePattern === "mdx") return f.name.endsWith(".mdx");
			if (filePattern === "both")
				return f.name.endsWith(".md") || f.name.endsWith(".mdx");
			return true;
		});

		// Pick up to 3 sample files
		const samplePaths = filePaths?.slice(0, 3) ??
			matchingFiles.slice(0, 3).map((f) => f.path);

		// Read file contents
		const sampleContents: { path: string; content: string }[] = [];
		for (const path of samplePaths) {
			try {
				const { content } = await readFileContent(
					octokit,
					repoOwner,
					repoName,
					path,
				);
				// Truncate very long files to ~3000 chars
				sampleContents.push({
					path,
					content: content.slice(0, 3000),
				});
			} catch {
				// Skip files that can't be read
			}
		}

		if (sampleContents.length === 0) {
			return Response.json(
				{ error: "No readable content files found in the specified path." },
				{ status: 400 },
			);
		}

		const model = createResearchProvider(
			apiKeys.openrouter,
			"anthropic/claude-sonnet-4",
		);

		const systemPrompt = `You are an expert content template designer. You analyze content files from a repository and suggest a structured template layout.

Your task: analyze the sample files below and suggest template sections that match the content structure.

Rules:
- Look at frontmatter fields, heading structure, and content patterns
- Suggest sections that would capture the key parts of the content
- Use appropriate fieldType values: "text" (short text), "markdown" (long-form content), "list" (bullet points), "tags" (comma-separated), "number", "url", "image"
- Order sections logically (metadata first, then content sections)
- Include 4-10 sections typically
- Output ONLY a JSON array wrapped in <SECTIONS>...</SECTIONS> tags
- No explanation or preamble outside the tags

Each section object must have:
- name: lowercase slug (e.g. "meta_description")
- label: human-readable label (e.g. "Meta Description")
- fieldType: one of "text", "markdown", "list", "number", "url", "tags", "image"
- required: boolean
- order: integer starting at 0
- description: brief description of what this section captures`;

		const userPrompt = `Template: "${templateName || "Untitled"}"
Content type: ${contentType || "article"}
Repository: ${repoOwner}/${repoName}
Base path: ${basePath || "/"}

Sample files:
${sampleContents.map((f) => `--- ${f.path} ---\n${f.content}\n`).join("\n")}

Analyze these files and suggest template sections.`;

		const result = streamText({
			model,
			system: systemPrompt,
			prompt: userPrompt,
		});

		return result.toTextStreamResponse();
	} catch (error) {
		console.error("Generate sections error:", error);
		return Response.json(
			{ error: "Failed to generate sections" },
			{ status: 500 },
		);
	}
}
