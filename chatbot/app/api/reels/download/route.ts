/**
 * Reels Download API Route
 *
 * Proxies to Python backend: downloads reel, extracts audio, uploads to Bunny CDN.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSettings } from "@/lib/db/queries";
import { seoApi } from "@/lib/seo-api-client";

export async function POST(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { url } = await request.json();
		if (!url || typeof url !== "string") {
			return NextResponse.json(
				{ error: "Missing Instagram URL" },
				{ status: 400 },
			);
		}

		// Get user's Bunny credentials
		const settings = await getUserSettings({ userId });
		const bunnyStorageKey = settings.apiKeys?.bunnyStorage;
		const bunnyCdnHostname = settings.apiKeys?.bunnyCdnHostname;

		if (!bunnyStorageKey || !bunnyCdnHostname) {
			return NextResponse.json(
				{ error: "Bunny CDN credentials not configured. Add them in Settings." },
				{ status: 400 },
			);
		}

		// Call Python backend
		const result = await seoApi.downloadReel({
			url,
			userId,
			bunnyStorageKey,
			bunnyCdnHostname,
		});

		return NextResponse.json(result);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Download failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
