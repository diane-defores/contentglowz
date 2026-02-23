/**
 * Reels Upload Audio API Route
 *
 * Accepts recorded audio from the browser and uploads to Bunny CDN.
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
		const bunnyStorageKey = settings.apiKeys?.bunnyStorage;
		const bunnyCdnHostname = settings.apiKeys?.bunnyCdnHostname;

		if (!bunnyStorageKey || !bunnyCdnHostname) {
			return NextResponse.json(
				{ error: "Bunny CDN credentials not configured. Add them in Settings." },
				{ status: 400 },
			);
		}

		const formData = await request.formData();
		const audioFile = formData.get("audio") as File | null;
		const reelId = formData.get("reelId") as string | null;

		if (!audioFile || !reelId) {
			return NextResponse.json(
				{ error: "Missing audio file or reelId" },
				{ status: 400 },
			);
		}

		const arrayBuffer = await audioFile.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Upload to Bunny CDN
		const cdnPath = `reels/${reelId}/user-voice.webm`;
		const storageZone = "my-robots";
		const uploadUrl = `https://storage.bunnycdn.com/${storageZone}/${cdnPath}`;

		const uploadResponse = await fetch(uploadUrl, {
			method: "PUT",
			headers: {
				AccessKey: bunnyStorageKey,
				"Content-Type": "application/octet-stream",
			},
			body: buffer,
		});

		if (!uploadResponse.ok) {
			const errorText = await uploadResponse.text();
			return NextResponse.json(
				{ error: `Bunny upload failed: ${errorText}` },
				{ status: 500 },
			);
		}

		const audioUrl = `https://${bunnyCdnHostname}/${cdnPath}`;

		return NextResponse.json({ audioUrl });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Audio upload failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
