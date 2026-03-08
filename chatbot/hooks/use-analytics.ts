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

			try {
				const params = new URLSearchParams({
					projectId,
					dateRange: range,
				});
				const res = await fetch(`/api/analytics/posthog?${params}`);
				if (!res.ok) {
					const body = await res.json().catch(() => ({}));
					if (body.code === "not_configured") {
						setError("not_configured");
						setData(null);
						return;
					}
					throw new Error(body.error ?? "Failed to fetch analytics data");
				}
				setData(await res.json());
			} catch (err) {
				if (error !== "not_configured") {
					setError(err instanceof Error ? err.message : "Unknown error");
				}
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
