import "server-only";

import {
	getGmailTokenByUserId,
	upsertGmailToken,
} from "./db/queries";

// ============================================================================
// OAuth URL & Token Exchange
// ============================================================================

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

const SCOPES = [
	"https://www.googleapis.com/auth/gmail.readonly",
	"email",
	"profile",
].join(" ");

/** Builds the Google OAuth consent URL */
export function getGoogleAuthUrl(redirectUri: string, state?: string): string {
	const params = new URLSearchParams({
		client_id: process.env.GOOGLE_CLIENT_ID!,
		redirect_uri: redirectUri,
		response_type: "code",
		scope: SCOPES,
		access_type: "offline",
		prompt: "consent",
	});
	if (state) params.set("state", state);
	return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/** Exchanges an authorization code for access + refresh tokens */
export async function exchangeCodeForTokens(
	code: string,
	redirectUri: string,
): Promise<{
	access_token: string;
	refresh_token: string;
	expires_in: number;
	scope: string;
}> {
	const res = await fetch(GOOGLE_TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			code,
			client_id: process.env.GOOGLE_CLIENT_ID!,
			client_secret: process.env.GOOGLE_CLIENT_SECRET!,
			redirect_uri: redirectUri,
			grant_type: "authorization_code",
		}),
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Token exchange failed: ${err}`);
	}

	return res.json();
}

/** Refreshes an expired access token using the refresh token */
export async function refreshAccessToken(
	refreshToken: string,
): Promise<{
	access_token: string;
	expires_in: number;
}> {
	const res = await fetch(GOOGLE_TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			refresh_token: refreshToken,
			client_id: process.env.GOOGLE_CLIENT_ID!,
			client_secret: process.env.GOOGLE_CLIENT_SECRET!,
			grant_type: "refresh_token",
		}),
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Token refresh failed: ${err}`);
	}

	return res.json();
}

/** Gets the email address of the authenticated Google user */
export async function getGmailUserEmail(
	accessToken: string,
): Promise<string> {
	const res = await fetch(GOOGLE_USERINFO_URL, {
		headers: { Authorization: `Bearer ${accessToken}` },
	});

	if (!res.ok) {
		throw new Error("Failed to get Google user info");
	}

	const data = await res.json();
	return data.email;
}

// ============================================================================
// Token Management
// ============================================================================

/**
 * Gets a valid access token for a user, refreshing if expired.
 * Returns null if no token exists.
 */
export async function getValidAccessToken(
	userId: string,
): Promise<string | null> {
	const token = await getGmailTokenByUserId({ userId });
	if (!token) return null;

	// If token expires in less than 60 seconds, refresh it
	const now = new Date();
	const bufferMs = 60 * 1000;
	if (token.expiresAt.getTime() - now.getTime() < bufferMs) {
		try {
			const refreshed = await refreshAccessToken(token.refreshToken);
			const newExpiresAt = new Date(
				Date.now() + refreshed.expires_in * 1000,
			);

			await upsertGmailToken({
				userId,
				email: token.email,
				accessToken: refreshed.access_token,
				refreshToken: token.refreshToken,
				expiresAt: newExpiresAt,
				scope: token.scope,
			});

			return refreshed.access_token;
		} catch {
			// Refresh failed — token is revoked or invalid
			return null;
		}
	}

	return token.accessToken;
}

// ============================================================================
// Gmail API — Sender Scanning
// ============================================================================

export interface SenderInfo {
	from_email: string;
	from_name: string;
	email_count: number;
	is_newsletter: boolean;
	latest_subject: string;
	latest_date: string | null;
}

interface GmailMessageMetadata {
	id: string;
	payload?: {
		headers?: Array<{ name: string; value: string }>;
	};
}

/**
 * Scans Gmail for senders in the last N days.
 * Groups by sender email, counts occurrences, detects newsletters.
 */
export async function scanGmailSenders(
	accessToken: string,
	daysBack: number,
): Promise<SenderInfo[]> {
	// 1. List message IDs
	const query = `newer_than:${daysBack}d`;
	const listUrl = `${GMAIL_API_BASE}/messages?q=${encodeURIComponent(query)}&maxResults=200`;

	const listRes = await fetch(listUrl, {
		headers: { Authorization: `Bearer ${accessToken}` },
	});

	if (!listRes.ok) {
		throw new Error(`Gmail list messages failed: ${listRes.status}`);
	}

	const listData = await listRes.json();
	const messageIds: string[] = (listData.messages || []).map(
		(m: { id: string }) => m.id,
	);

	if (messageIds.length === 0) return [];

	// 2. Fetch metadata for each message (batch in groups of 20)
	const senderMap = new Map<
		string,
		{
			name: string;
			count: number;
			isNewsletter: boolean;
			latestSubject: string;
			latestDate: string | null;
		}
	>();

	const batchSize = 20;
	for (let i = 0; i < messageIds.length; i += batchSize) {
		const batch = messageIds.slice(i, i + batchSize);
		const metadataPromises = batch.map((id) =>
			fetch(
				`${GMAIL_API_BASE}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=List-Unsubscribe&metadataHeaders=Date`,
				{ headers: { Authorization: `Bearer ${accessToken}` } },
			).then((r) => (r.ok ? (r.json() as Promise<GmailMessageMetadata>) : null)),
		);

		const results = await Promise.all(metadataPromises);

		for (const msg of results) {
			if (!msg?.payload?.headers) continue;

			const headers = msg.payload.headers;
			const fromHeader = headers.find((h) => h.name === "From")?.value || "";
			const subject =
				headers.find((h) => h.name === "Subject")?.value || "(no subject)";
			const listUnsub = headers.find(
				(h) => h.name === "List-Unsubscribe",
			)?.value;
			const dateHeader = headers.find((h) => h.name === "Date")?.value || null;

			// Parse "Name <email>" format
			const emailMatch = fromHeader.match(/<([^>]+)>/);
			const email = emailMatch ? emailMatch[1] : fromHeader.trim();
			const name = emailMatch
				? fromHeader.replace(/<[^>]+>/, "").trim().replace(/^"|"$/g, "")
				: email;

			if (!email) continue;

			const existing = senderMap.get(email);
			if (existing) {
				existing.count++;
				// Keep the latest subject/date
			} else {
				senderMap.set(email, {
					name,
					count: 1,
					isNewsletter: !!listUnsub,
					latestSubject: subject,
					latestDate: dateHeader,
				});
			}
		}
	}

	// 3. Convert to array, sort by count desc, prioritize newsletters
	const senders: SenderInfo[] = Array.from(senderMap.entries())
		.map(([email, data]) => ({
			from_email: email,
			from_name: data.name,
			email_count: data.count,
			is_newsletter: data.isNewsletter,
			latest_subject: data.latestSubject,
			latest_date: data.latestDate,
		}))
		.sort((a, b) => {
			// Newsletters first, then by count
			if (a.is_newsletter !== b.is_newsletter) {
				return a.is_newsletter ? -1 : 1;
			}
			return b.email_count - a.email_count;
		});

	return senders;
}
