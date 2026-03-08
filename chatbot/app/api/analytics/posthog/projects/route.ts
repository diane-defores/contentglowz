import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSettings } from "@/lib/db/queries";

/**
 * GET /api/analytics/posthog/projects
 *
 * Lists all PostHog projects the user has access to.
 * Uses the user's PostHog personal API key stored in settings.
 */
export async function GET() {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const settings = await getUserSettings({ userId });
		const apiKey = settings.apiKeys?.posthog;

		if (!apiKey) {
			return NextResponse.json(
				{ error: "PostHog API key not configured" },
				{ status: 400 },
			);
		}

		const host = (settings.apiKeys?.posthogHost || "https://us.i.posthog.com").replace(/\/+$/, "");

		const response = await fetch(
			`${host}/api/organizations/@current/projects/`,
			{
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
			},
		);

		if (!response.ok) {
			const detail = await response.text().catch(() => "Unknown error");
			return NextResponse.json(
				{ error: `PostHog API error (${response.status}): ${detail}` },
				{ status: 502 },
			);
		}

		const data = await response.json();

		// PostHog returns { results: [...] } or an array directly
		const projects = (data.results ?? data) as Array<{
			id: number;
			name: string;
			uuid: string;
		}>;

		return NextResponse.json(
			projects.map((p) => ({
				id: p.id,
				name: p.name,
				uuid: p.uuid,
			})),
		);
	} catch (error) {
		console.error("[posthog/projects] error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch PostHog projects" },
			{ status: 500 },
		);
	}
}
