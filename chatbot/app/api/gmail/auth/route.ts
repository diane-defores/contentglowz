import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getGoogleAuthUrl } from "@/lib/gmail";

export async function GET(request: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const origin = request.nextUrl.origin;
	const redirectUri = `${origin}/api/gmail/callback`;
	const url = getGoogleAuthUrl(redirectUri, userId);

	return NextResponse.json({ url });
}
