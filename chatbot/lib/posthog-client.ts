/**
 * PostHog Analytics API Client
 *
 * Server-side client for querying PostHog analytics data via HogQL.
 * Used by the /api/analytics/posthog route to proxy requests securely.
 */

const DEFAULT_HOST = "https://us.i.posthog.com";
const DEFAULT_LIMIT = 10;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostHogDateRange {
	/** Relative ("-7d", "-30d", "-90d") or ISO date string */
	date_from: string;
	/** Optional end bound; defaults to "now" */
	date_to?: string;
}

export type PostHogQueryType =
	| "pageviews"
	| "unique_visitors"
	| "top_pages"
	| "referral_sources"
	| "top_countries";

export interface PostHogQueryParams {
	type: PostHogQueryType;
	dateRange: PostHogDateRange;
	limit?: number;
}

/** A single row returned by a HogQL query. */
export interface PostHogResultRow {
	[key: string]: string | number | null;
}

export interface PostHogQueryResult {
	columns: string[];
	rows: PostHogResultRow[];
	/** The raw HogQL query that was executed (useful for debugging). */
	hogql: string;
}

export interface PostHogErrorDetail {
	type: string;
	code: string;
	detail: string;
}

// ---------------------------------------------------------------------------
// HogQL query builders
// ---------------------------------------------------------------------------

function buildDateFilter(dateRange: PostHogDateRange): string {
	const from = dateRange.date_from;
	const to = dateRange.date_to ?? "now";

	// Relative dates like -7d, -30d, -90d
	if (from.startsWith("-") && from.endsWith("d")) {
		const days = Math.abs(Number.parseInt(from, 10));
		if (Number.isNaN(days) || days <= 0) {
			throw new Error(`Invalid relative date: ${from}`);
		}
		const toClause =
			to === "now"
				? ""
				: ` AND timestamp <= toDateTime('${sanitiseISODate(to)}')`;
		return `timestamp >= now() - interval ${days} day${toClause}`;
	}

	// Absolute ISO dates
	const fromClause = `timestamp >= toDateTime('${sanitiseISODate(from)}')`;
	const toClause =
		to === "now"
			? ""
			: ` AND timestamp <= toDateTime('${sanitiseISODate(to)}')`;
	return `${fromClause}${toClause}`;
}

/** Minimal ISO-date sanitisation to prevent injection. */
function sanitiseISODate(value: string): string {
	// Allow ISO 8601 date / datetime characters only
	if (!/^[\d\-T:.Z+]+$/.test(value)) {
		throw new Error(`Invalid date value: ${value}`);
	}
	return value;
}

function buildHogQL(params: PostHogQueryParams): string {
	const dateFilter = buildDateFilter(params.dateRange);
	const limit = params.limit ?? DEFAULT_LIMIT;

	switch (params.type) {
		case "pageviews":
			return [
				"SELECT toDate(timestamp) AS day, count() AS total",
				"FROM events",
				`WHERE event = '$pageview' AND ${dateFilter}`,
				"GROUP BY day",
				"ORDER BY day ASC",
			].join(" ");

		case "unique_visitors":
			return [
				"SELECT toDate(timestamp) AS day, count(DISTINCT distinct_id) AS unique_visitors",
				"FROM events",
				`WHERE event = '$pageview' AND ${dateFilter}`,
				"GROUP BY day",
				"ORDER BY day ASC",
			].join(" ");

		case "top_pages":
			return [
				"SELECT properties.$current_url AS url, count() AS total",
				"FROM events",
				`WHERE event = '$pageview' AND ${dateFilter}`,
				"GROUP BY url",
				"ORDER BY total DESC",
				`LIMIT ${limit}`,
			].join(" ");

		case "referral_sources":
			return [
				"SELECT properties.$referring_domain AS referrer, count() AS total",
				"FROM events",
				`WHERE event = '$pageview' AND ${dateFilter} AND properties.$referring_domain != ''`,
				"GROUP BY referrer",
				"ORDER BY total DESC",
				`LIMIT ${limit}`,
			].join(" ");

		case "top_countries":
			return [
				"SELECT properties.$geoip_country_code AS country, count() AS total",
				"FROM events",
				`WHERE event = '$pageview' AND ${dateFilter}`,
				"GROUP BY country",
				"ORDER BY total DESC",
				`LIMIT ${limit}`,
			].join(" ");

		default: {
			const _exhaustive: never = params.type;
			throw new Error(`Unknown query type: ${_exhaustive}`);
		}
	}
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class PostHogClient {
	private readonly apiKey: string;
	private readonly host: string;

	constructor(personalApiKey: string, host?: string) {
		this.apiKey = personalApiKey;
		this.host = (host ?? DEFAULT_HOST).replace(/\/+$/, "");
	}

	/**
	 * Execute a HogQL analytics query against a PostHog project.
	 *
	 * @throws {PostHogApiError} when the upstream API returns a non-2xx status.
	 */
	async query(
		projectId: string,
		params: PostHogQueryParams,
	): Promise<PostHogQueryResult> {
		const hogql = buildHogQL(params);
		const url = `${this.host}/api/projects/${encodeURIComponent(projectId)}/query`;

		const response = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				query: {
					kind: "HogQLQuery",
					query: hogql,
				},
			}),
		});

		if (!response.ok) {
			let detail: string;
			try {
				const body = await response.json();
				detail =
					body.detail ?? body.message ?? JSON.stringify(body);
			} catch {
				detail = await response.text();
			}
			throw new PostHogApiError(
				`PostHog API error (${response.status}): ${detail}`,
				response.status,
			);
		}

		const data = await response.json();

		// The HogQL query endpoint returns { columns, results, hogql, ... }
		const columns: string[] = data.columns ?? [];
		const rawRows: unknown[][] = data.results ?? [];

		const rows: PostHogResultRow[] = rawRows.map((row) => {
			const obj: PostHogResultRow = {};
			for (let i = 0; i < columns.length; i++) {
				obj[columns[i]] = row[i] as string | number | null;
			}
			return obj;
		});

		return {
			columns,
			rows,
			hogql: data.hogql ?? hogql,
		};
	}
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class PostHogApiError extends Error {
	public readonly statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = "PostHogApiError";
		this.statusCode = statusCode;
	}
}
