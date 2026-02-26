import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const CRUX_API_URL =
	"https://chromeuxreport.googleapis.com/v1/records:queryRecord";
const PSI_API_URL =
	"https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

const METRICS_CONFIG: Record<
	string,
	{
		label: string;
		unit: string;
		isCoreCWV: boolean;
		good: number;
		needs_improvement: number;
		psiAuditKey: string;
	}
> = {
	largest_contentful_paint: {
		label: "LCP",
		unit: "ms",
		isCoreCWV: true,
		good: 2500,
		needs_improvement: 4000,
		psiAuditKey: "largest-contentful-paint",
	},
	cumulative_layout_shift: {
		label: "CLS",
		unit: "score",
		isCoreCWV: true,
		good: 0.1,
		needs_improvement: 0.25,
		psiAuditKey: "cumulative-layout-shift",
	},
	interaction_to_next_paint: {
		label: "INP",
		unit: "ms",
		isCoreCWV: true,
		good: 200,
		needs_improvement: 500,
		psiAuditKey: "interaction-to-next-paint",
	},
	first_contentful_paint: {
		label: "FCP",
		unit: "ms",
		isCoreCWV: false,
		good: 1800,
		needs_improvement: 3000,
		psiAuditKey: "first-contentful-paint",
	},
	experimental_time_to_first_byte: {
		label: "TTFB",
		unit: "ms",
		isCoreCWV: false,
		good: 800,
		needs_improvement: 1800,
		psiAuditKey: "server-response-time",
	},
};

function getRating(
	key: string,
	value: number | null,
): "good" | "needs_improvement" | "poor" | "unknown" {
	if (value === null || value === undefined) return "unknown";
	const t = METRICS_CONFIG[key];
	if (!t) return "unknown";
	if (value <= t.good) return "good";
	if (value <= t.needs_improvement) return "needs_improvement";
	return "poor";
}

async function queryCrUX(url: string, apiKey: string) {
	const res = await fetch(`${CRUX_API_URL}?key=${apiKey}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ url }),
	});

	if (!res.ok) return null;

	const data = await res.json();
	const record = data.record ?? {};
	const metricsRaw = record.metrics ?? {};
	const period = record.collectionPeriod ?? {};

	const metrics: Record<
		string,
		{ p75: number | null; rating: string; histogram: number[] }
	> = {};

	for (const [key, raw] of Object.entries(metricsRaw) as [
		string,
		{ percentiles?: { p75: number }; histogram?: { density: number }[] },
	][]) {
		const p75 = raw.percentiles?.p75 ?? null;
		metrics[key] = {
			p75,
			rating: getRating(key, p75),
			histogram: (raw.histogram ?? []).map((b) =>
				Math.round((b.density ?? 0) * 1000) / 10,
			),
		};
	}

	return { metrics, collectionPeriod: { start: period.firstDate, end: period.lastDate } };
}

async function queryPSI(url: string, apiKey: string) {
	const params = new URLSearchParams({
		url,
		strategy: "mobile",
		key: apiKey,
		category: "performance",
	});
	const res = await fetch(`${PSI_API_URL}?${params}`);
	if (!res.ok) return null;

	const data = await res.json();
	const audits = data.lighthouseResult?.audits ?? {};
	const score = data.lighthouseResult?.categories?.performance?.score ?? null;

	const metrics: Record<string, { value: number | null; rating: string }> = {};
	for (const [key, cfg] of Object.entries(METRICS_CONFIG)) {
		const value = audits[cfg.psiAuditKey]?.numericValue ?? null;
		metrics[key] = { value, rating: getRating(key, value) };
	}

	return {
		metrics,
		performanceScore: score !== null ? Math.round(score * 100) : null,
	};
}

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const url = request.nextUrl.searchParams.get("url");
		if (!url) {
			return NextResponse.json(
				{ error: "url parameter is required" },
				{ status: 400 },
			);
		}

		const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
		if (!apiKey) {
			return NextResponse.json(
				{ error: "GOOGLE_PAGESPEED_API_KEY not configured" },
				{ status: 503 },
			);
		}

		// Both in parallel
		const [cruxResult, psiResult] = await Promise.allSettled([
			queryCrUX(url, apiKey),
			queryPSI(url, apiKey),
		]);

		const crux =
			cruxResult.status === "fulfilled" ? cruxResult.value : null;
		const psi =
			psiResult.status === "fulfilled" ? psiResult.value : null;

		// Merge per metric
		const metrics: Record<string, unknown> = {};
		for (const [key, cfg] of Object.entries(METRICS_CONFIG)) {
			const field = crux?.metrics[key] ?? null;
			const lab = psi?.metrics[key] ?? null;
			metrics[key] = {
				label: cfg.label,
				unit: cfg.unit,
				isCoreCWV: cfg.isCoreCWV,
				field,
				lab,
			};
		}

		// Overall CWV pass/fail — from field data only (that's what Google uses for ranking)
		const cwvKeys = [
			"largest_contentful_paint",
			"cumulative_layout_shift",
			"interaction_to_next_paint",
		];
		const overallCwv = crux
			? cwvKeys.every(
					(k) => (metrics[k] as { field: { rating: string } | null }).field?.rating === "good",
				)
				? "good"
				: "poor"
			: null;

		return NextResponse.json({
			url,
			hasFieldData: !!crux,
			overallCwv,
			performanceScore: psi?.performanceScore ?? null,
			collectionPeriod: crux?.collectionPeriod ?? null,
			metrics,
		});
	} catch (error) {
		console.error("[performance] API error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch performance data" },
			{ status: 500 },
		);
	}
}
