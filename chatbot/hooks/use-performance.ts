"use client";

import { useCallback, useEffect, useState } from "react";

export type MetricRating = "good" | "needs_improvement" | "poor" | "unknown";

export type FieldMetric = {
	p75: number | null;
	rating: MetricRating;
	histogram: number[]; // [good%, needs_improvement%, poor%]
};

export type LabMetric = {
	value: number | null;
	rating: MetricRating;
};

export type MergedMetric = {
	label: string;
	unit: string;
	isCoreCWV: boolean;
	field: FieldMetric | null; // CrUX real-user data
	lab: LabMetric | null; // PSI lab simulation
};

export type PerformanceData = {
	url: string;
	hasFieldData: boolean;
	overallCwv: "good" | "poor" | null; // CrUX only — what Google uses for ranking
	performanceScore: number | null; // PSI score 0–100
	collectionPeriod: { start: unknown; end: unknown } | null;
	metrics: Record<string, MergedMetric>;
};

export function usePerformance(initialUrl?: string) {
	const [url, setUrl] = useState(initialUrl ?? "");
	const [data, setData] = useState<PerformanceData | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const analyze = useCallback(async (targetUrl: string) => {
		if (!targetUrl) return;
		setLoading(true);
		setError(null);
		setData(null);

		try {
			const res = await fetch(
				`/api/performance?url=${encodeURIComponent(targetUrl)}`,
			);
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error ?? "Failed to fetch performance data");
			}
			setData(await res.json());
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (initialUrl) analyze(initialUrl);
	}, [initialUrl, analyze]);

	return { url, setUrl, data, loading, error, analyze, clearError: () => setError(null) };
}
