/**
 * Reels Rewrite API Route
 *
 * Uses OpenRouter LLM to rewrite a transcript into a fresh script.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSettings } from "@/lib/db/queries";

export async function POST(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const settings = await getUserSettings({ userId });
		const openrouterKey = settings.apiKeys?.openrouter;
		if (!openrouterKey) {
			return NextResponse.json(
				{ error: "OpenRouter API key not configured. Add it in Settings." },
				{ status: 400 },
			);
		}

		const { transcript, language, instructions } = await request.json();
		if (!transcript || typeof transcript !== "string") {
			return NextResponse.json(
				{ error: "Missing transcript" },
				{ status: 400 },
			);
		}

		const systemPrompt = `You are a social media script rewriter. Your job is to rewrite Instagram Reel transcripts into fresh, original scripts that the user will record with their own voice.

Rules:
- Keep the same topic, key points, and approximate length
- Make it sound natural for speaking out loud (not reading)
- Use simple, conversational language
- Keep sentences short for easy reading on a teleprompter
- Maintain the same language as the original (${language || "auto-detect"})
- Do NOT add hashtags, emojis, or formatting — just the spoken text
- Output ONLY the rewritten script, nothing else`;

		const userPrompt = instructions
			? `Original transcript:\n${transcript}\n\nAdditional instructions: ${instructions}`
			: `Original transcript:\n${transcript}`;

		const response = await fetch(
			"https://openrouter.ai/api/v1/chat/completions",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${openrouterKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model: "google/gemini-2.0-flash-001",
					messages: [
						{ role: "system", content: systemPrompt },
						{ role: "user", content: userPrompt },
					],
					temperature: 0.7,
					max_tokens: 2000,
				}),
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			return NextResponse.json(
				{ error: `OpenRouter API error: ${errorText}` },
				{ status: response.status },
			);
		}

		const data = await response.json();
		const rewrittenText =
			data.choices?.[0]?.message?.content?.trim() || "";

		return NextResponse.json({
			rewrittenText,
			model: data.model,
			usage: data.usage,
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Rewrite failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
