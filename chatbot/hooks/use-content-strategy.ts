"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface FunnelStageData {
	stage: string;
	label: string;
	count: number;
	percentage: number;
	isGap: boolean;
}

export interface ClusterHealthData {
	cluster: string;
	count: number;
	avgMetadataScore: number;
	grade: string;
	problem: string | null;
}

export interface ContentStrategyData {
	total: number;
	uncategorized: number;
	funnelDistribution: FunnelStageData[];
	clusterHealth: ClusterHealthData[];
}

export function useContentStrategy(projectId?: string) {
	const [data, setData] = useState<ContentStrategyData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const requestIdRef = useRef(0);

	const fetch = useCallback(async () => {
		if (!projectId) {
			setData(null);
			setError(null);
			setLoading(false);
			return;
		}

		const requestId = requestIdRef.current + 1;
		requestIdRef.current = requestId;

		setLoading(true);
		setError(null);

		try {
			const params = new URLSearchParams();
			params.set("projectId", projectId);
			const res = await window.fetch(`/api/content/funnel-stats?${params}`);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = await res.json();
			if (requestIdRef.current !== requestId) return;
			setData(json);
		} catch (err) {
			if (requestIdRef.current !== requestId) return;
			setError(
				err instanceof Error ? err.message : "Failed to load strategy data",
			);
		} finally {
			if (requestIdRef.current === requestId) {
				setLoading(false);
			}
		}
	}, [projectId]);

	useEffect(() => {
		fetch();
	}, [fetch]);

	return { data, loading, error, refresh: fetch };
}
