/**
 * Generate Prompts API Route (Step 2)
 *
 * Streams AI-generated prompts for all template sections at once.
 * Output uses XML delimiters: <SECTION name="...">prompt text</SECTION>
 * so the client can parse and fill each section's defaultPrompt in real-time.
 */
import { streamText } from "ai";
import { auth } from "@clerk/nextjs/server";
import { createResearchProvider } from "@/lib/ai/research-provider";
import { getUserSettings } from "@/lib/db/queries";

export const maxDuration = 60;

export async function POST(request: Request) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { templateName, contentType, templateDescription, sections } =
			body as {
				templateName: string;
				contentType: string;
				templateDescription?: string;
				sections: Array<{
					name: string;
					label: string;
					fieldType: string;
					description?: string;
				}>;
			};

		if (!sections || sections.length < 1) {
			return Response.json(
				{ error: "At least one section is required" },
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

		const model = createResearchProvider(
			apiKeys.openrouter,
			"anthropic/claude-sonnet-4",
		);

		const systemPrompt = `You are an expert content strategist and prompt engineer. Your job is to write detailed, actionable prompts that will instruct a future AI to generate content for each section of a content template.

Rules:
- Each prompt should be specific and actionable
- Include guidance on length, structure, tone, and style
- Reference the field type when relevant:
  - "text": short text (1-2 sentences usually)
  - "markdown": long-form content with headings, paragraphs, formatting
  - "list": bulleted or numbered list items
  - "tags": comma-separated keywords or tags
  - "number": a numeric value with context
  - "url": a URL with context
  - "image": image description or alt text guidance
- Consider inter-section coherence (sections should work together)
- Include quality criteria and SEO best practices where relevant
- Output ONLY <SECTION> blocks, no preamble or explanation

Output format (one block per section, in order):
<SECTION name="section_name">
The prompt text goes here...
</SECTION>`;

		const sectionsList = sections
			.map(
				(s, i) =>
					`${i + 1}. name="${s.name}" | label="${s.label}" | type="${s.fieldType}"${s.description ? ` | description="${s.description}"` : ""}`,
			)
			.join("\n");

		const userPrompt = `Template: "${templateName || "Untitled"}"
Content type: ${contentType || "article"}${templateDescription ? `\nDescription: ${templateDescription}` : ""}

Sections to write prompts for:
${sectionsList}

Write a detailed, actionable prompt for each section.`;

		const result = streamText({
			model,
			system: systemPrompt,
			prompt: userPrompt,
		});

		return result.toTextStreamResponse();
	} catch (error) {
		console.error("Generate prompts error:", error);
		return Response.json(
			{ error: "Failed to generate prompts" },
			{ status: 500 },
		);
	}
}
