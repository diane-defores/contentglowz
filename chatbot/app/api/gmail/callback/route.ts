import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
	exchangeCodeForTokens,
	getGmailUserEmail,
} from "@/lib/gmail";
import { upsertGmailToken } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
	const code = request.nextUrl.searchParams.get("code");
	if (!code) {
		return NextResponse.redirect(
			new URL("/dashboard?tab=newsletter&gmail=error", request.url),
		);
	}

	// Get the current user
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.redirect(
			new URL("/login", request.url),
		);
	}

	try {
		const origin = request.nextUrl.origin;
		const redirectUri = `${origin}/api/gmail/callback`;

		// Exchange auth code for tokens
		const tokens = await exchangeCodeForTokens(code, redirectUri);

		// Get the Gmail email address
		const email = await getGmailUserEmail(tokens.access_token);

		// Store in database
		const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
		await upsertGmailToken({
			userId,
			email,
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			expiresAt,
			scope: tokens.scope,
		});

		return NextResponse.redirect(
			new URL("/dashboard?tab=newsletter&gmail=connected", request.url),
		);
	} catch (error) {
		console.error("Gmail OAuth callback error:", error);
		return NextResponse.redirect(
			new URL("/dashboard?tab=newsletter&gmail=error", request.url),
		);
	}
}
