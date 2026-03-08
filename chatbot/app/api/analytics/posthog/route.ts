import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getProjectById, getUserSettings } from "@/lib/db/queries";
import {
	PostHogApiError,
	PostHogClient,
	type PostHogQueryType,
} from "@/lib/posthog-client";

const VALID_QUERY_TYPES: PostHogQueryType[] = [
	"pageviews",
	"unique_visitors",
	"top_pages",
	"referral_sources",
	"top_countries",
];

/**
 * GET /api/analytics/posthog
 *
 * Server-side proxy for PostHog analytics queries.
 *
 * Query params:
 *   - projectId  (required) — internal project ID (looked up to get posthogProjectId)
 *   - type       (required) — one of: pageviews, unique_visitors, top_pages, referral_sources, top_countries
 *   - date_from  (required) — relative (-7d, -30d) or ISO date
 *   - date_to    (optional) — defaults to "now"
 *   - limit      (optional) — max rows for ranked queries (default 10)
 */
export async function GET(request: NextRequest) {
	// 1. Authenticate
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// 2. Parse query params
	const { searchParams } = request.nextUrl;
	const projectId = searchParams.get("projectId");
	const type = searchParams.get("type") as PostHogQueryType | null;
	const dateFrom = searchParams.get("date_from");
	const dateTo = searchParams.get("date_to") ?? undefined;
	const limitRaw = searchParams.get("limit");

	if (!projectId) {
		return NextResponse.json(
			{ error: "Missing required parameter: projectId" },
			{ status: 400 },
		);
	}

	if (!type || !VALID_QUERY_TYPES.includes(type)) {
		return NextResponse.json(
			{
				error: `Invalid or missing parameter: type. Must be one of: ${VALID_QUERY_TYPES.join(", ")}`,
			},
			{ status: 400 },
		);
	}

	if (!dateFrom) {
		return NextResponse.json(
			{ error: "Missing required parameter: date_from" },
			{ status: 400 },
		);
	}

	const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
	if (limitRaw && (Number.isNaN(limit) || (limit !== undefined && limit <= 0))) {
		return NextResponse.json(
			{ error: "Parameter limit must be a positive integer" },
			{ status: 400 },
		);
	}

	try {
		// 3. Get user's PostHog API key from settings
		const settings = await getUserSettings({ userId });
		const posthogApiKey = settings.apiKeys?.posthog;

		if (!posthogApiKey) {
			return NextResponse.json(
				{
					error:
						"PostHog API key not configured. Add your personal API key in Settings.",
				},
				{ status: 400 },
			);
		}

		const posthogHost = settings.apiKeys?.posthogHost || undefined;

		// 4. Look up the project and get the PostHog project ID
		const proj = await getProjectById({ id: projectId });

		if (!proj) {
			return NextResponse.json(
				{ error: "Project not found" },
				{ status: 400 },
			);
		}

		// Verify the project belongs to this user
		if (proj.userId !== userId) {
			return NextResponse.json(
				{ error: "Project not found" },
				{ status: 400 },
			);
		}

		const posthogProjectId = proj.posthogProjectId;
		if (!posthogProjectId) {
			return NextResponse.json(
				{
					error:
						"PostHog project ID not configured for this project. Update the project settings.",
				},
				{ status: 400 },
			);
		}

		// 5. Execute the query
		const client = new PostHogClient(posthogApiKey, posthogHost);
		const result = await client.query(posthogProjectId, {
			type,
			dateRange: {
				date_from: dateFrom,
				date_to: dateTo,
			},
			limit,
		});

		return NextResponse.json(result);
	} catch (error) {
		if (error instanceof PostHogApiError) {
			return NextResponse.json(
				{ error: `PostHog API error: ${error.message}` },
				{ status: 502 },
			);
		}

		console.error("[analytics/posthog] Unexpected error:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch analytics",
				details:
					error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
