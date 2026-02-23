/**
 * Reels Cookies API Route
 *
 * Manages Instagram cookies via the Python backend.
 * POST: upload cookies, GET: check status, DELETE: remove cookies.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { seoApi } from "@/lib/seo-api-client";

export async function POST(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { cookiesContent } = await request.json();
		if (!cookiesContent || typeof cookiesContent !== "string") {
			return NextResponse.json(
				{ error: "Missing cookies content" },
				{ status: 400 },
			);
		}

		const result = await seoApi.uploadReelsCookies({
			userId,
			cookiesContent,
		});
		return NextResponse.json(result);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Cookie upload failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function GET() {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const result = await seoApi.getReelsCookieStatus(userId);
		return NextResponse.json(result);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to check cookies";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function DELETE() {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const result = await seoApi.deleteReelsCookies(userId);
		return NextResponse.json(result);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to delete cookies";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
