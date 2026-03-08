"use client";

import { useCallback, useEffect, useState } from "react";

export interface AnalyticsData {
	pageviews: { date: string; count: number }[];
	uniqueVisitors: { date: string; count: number }[];
	topPages: { url: string; path: string; count: number }[];
	referralSources: { source: string; count: number }[];
	topCountries: { country: string; count: number }[];
	// Summary
	totalPageviews: number;
	totalVisitors: number;
	avgPageviewsPerDay: number;
}

export type DateRange = "7d" | "30d" | "90d";

const DATE_FROM_MAP: Record<DateRange, string> = {
	"7d": "-7d",
	"30d": "-30d",
	"90d": "-90d",
};

async function fetchQuery(
	projectId: string,
	type: string,
	dateFrom: string,
): Promise<{ results: unknown[][]; columns: string[] } | null> {
	const params = new URLSearchParams({
		projectId,
		type,
		date_from: dateFrom,
	});
	const res = await fetch(`/api/analytics/posthog?${params}`);
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		if (body.code === "not_configured") {
			throw new NotConfiguredError(body.error);
		}
		throw new Error(body.error ?? `Failed to fetch ${type}`);
	}
	return res.json();
}

class NotConfiguredError extends Error {
	public readonly reason: string;
	constructor(reason?: string) {
		super("not_configured");
		this.name = "NotConfiguredError";
		this.reason = reason?.toLowerCase().includes("api key") ? "api_key" : "project_id";
	}
}

function buildAnalyticsData(
	pageviewsRes: { results: unknown[][]; columns: string[] } | null,
	visitorsRes: { results: unknown[][]; columns: string[] } | null,
	topPagesRes: { results: unknown[][]; columns: string[] } | null,
	referralsRes: { results: unknown[][]; columns: string[] } | null,
	countriesRes: { results: unknown[][]; columns: string[] } | null,
): AnalyticsData {
	const pageviews = (pageviewsRes?.results ?? []).map((r) => ({
		date: String(r[0]),
		count: Number(r[1]),
	}));

	const uniqueVisitors = (visitorsRes?.results ?? []).map((r) => ({
		date: String(r[0]),
		count: Number(r[1]),
	}));

	const topPages = (topPagesRes?.results ?? []).map((r) => ({
		url: String(r[0]),
		path: String(r[0]),
		count: Number(r[1]),
	}));

	const referralSources = (referralsRes?.results ?? []).map((r) => ({
		source: String(r[0]) || "(direct)",
		count: Number(r[1]),
	}));

	const topCountries = (countriesRes?.results ?? []).map((r) => ({
		country: String(r[0]) || "Unknown",
		count: Number(r[1]),
	}));

	const totalPageviews = pageviews.reduce((sum, d) => sum + d.count, 0);
	const totalVisitors = uniqueVisitors.reduce((sum, d) => sum + d.count, 0);
	const days = pageviews.length || 1;

	return {
		pageviews,
		uniqueVisitors,
		topPages,
		referralSources,
		topCountries,
		totalPageviews,
		totalVisitors,
		avgPageviewsPerDay: totalPageviews / days,
	};
}

export function useAnalytics(projectId?: string) {
	const [data, setData] = useState<AnalyticsData | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [dateRange, setDateRange] = useState<DateRange>("30d");

	const fetchAnalytics = useCallback(
		async (range: DateRange) => {
			if (!projectId) return;
			setLoading(true);
			setError(null);

			const dateFrom = DATE_FROM_MAP[range];

			try {
				const [pageviewsRes, visitorsRes, topPagesRes, referralsRes, countriesRes] =
					await Promise.all([
						fetchQuery(projectId, "pageviews", dateFrom),
						fetchQuery(projectId, "unique_visitors", dateFrom),
						fetchQuery(projectId, "top_pages", dateFrom),
						fetchQuery(projectId, "referral_sources", dateFrom),
						fetchQuery(projectId, "top_countries", dateFrom),
					]);

				setData(
					buildAnalyticsData(
						pageviewsRes,
						visitorsRes,
						topPagesRes,
						referralsRes,
						countriesRes,
					),
				);
			} catch (err) {
				if (err instanceof NotConfiguredError) {
					setError(`not_configured:${err.reason}`);
					setData(null);
					return;
				}
				setError(err instanceof Error ? err.message : "Unknown error");
			} finally {
				setLoading(false);
			}
		},
		[projectId],
	);

	useEffect(() => {
		fetchAnalytics(dateRange);
	}, [dateRange, fetchAnalytics]);

	const handleSetDateRange = useCallback(
		(range: DateRange) => {
			setDateRange(range);
		},
		[],
	);

	const refresh = useCallback(() => {
		fetchAnalytics(dateRange);
	}, [dateRange, fetchAnalytics]);

	return {
		data,
		loading,
		error,
		dateRange,
		setDateRange: handleSetDateRange,
		refresh,
	};
}
