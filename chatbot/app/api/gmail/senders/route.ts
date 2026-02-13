import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getValidAccessToken, scanGmailSenders } from "@/lib/gmail";

export async function GET(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const daysBack = Number(
		request.nextUrl.searchParams.get("days_back") || "30",
	);

	const accessToken = await getValidAccessToken(userId);
	if (!accessToken) {
		return NextResponse.json(
			{ error: "Gmail not connected or token expired" },
			{ status: 401 },
		);
	}

	try {
		const senders = await scanGmailSenders(accessToken, daysBack);
		return NextResponse.json({ senders, total: senders.length });
	} catch (error) {
		console.error("Gmail sender scan error:", error);
		return NextResponse.json(
			{ error: "Failed to scan Gmail senders" },
			{ status: 500 },
		);
	}
}
