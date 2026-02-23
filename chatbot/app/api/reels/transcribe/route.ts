/**
 * Reels Transcribe API Route
 *
 * Calls Groq Whisper API for word-level transcription.
 * Used twice: once for original audio, once for user's recorded voice.
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
		const groqKey = settings.apiKeys?.groq;
		if (!groqKey) {
			return NextResponse.json(
				{ error: "Groq API key not configured. Add it in Settings." },
				{ status: 400 },
			);
		}

		const contentType = request.headers.get("content-type") || "";

		let formData: FormData;

		if (contentType.includes("multipart/form-data")) {
			// Direct audio file upload
			formData = await request.formData();
		} else {
			// JSON body with audio URL — fetch the audio and build form data
			const { audioUrl } = await request.json();
			if (!audioUrl || typeof audioUrl !== "string") {
				return NextResponse.json(
					{ error: "Missing audioUrl" },
					{ status: 400 },
				);
			}

			const audioResponse = await fetch(audioUrl);
			if (!audioResponse.ok) {
				return NextResponse.json(
					{ error: "Failed to fetch audio file" },
					{ status: 400 },
				);
			}

			const audioBlob = await audioResponse.blob();
			formData = new FormData();
			formData.append("file", audioBlob, "audio.mp3");
		}

		// Ensure required Groq params
		formData.set("model", "whisper-large-v3-turbo");
		formData.set("response_format", "verbose_json");
		formData.set("timestamp_granularities[]", "word");

		const groqResponse = await fetch(
			"https://api.groq.com/openai/v1/audio/transcriptions",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${groqKey}`,
				},
				body: formData,
			},
		);

		if (!groqResponse.ok) {
			const errorText = await groqResponse.text();
			return NextResponse.json(
				{ error: `Groq API error: ${errorText}` },
				{ status: groqResponse.status },
			);
		}

		const data = await groqResponse.json();

		return NextResponse.json({
			text: data.text,
			words: data.words || [],
			language: data.language,
			duration: data.duration,
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Transcription failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
