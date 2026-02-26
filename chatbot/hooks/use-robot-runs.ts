"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface RobotRun {
	run_id: string;
	robot_name: string;
	workflow_type: string;
	started_at: string;
	finished_at: string | null;
	status: "running" | "success" | "error";
	inputs_json: Record<string, unknown> | null;
	outputs_summary_json: Record<string, unknown> | null;
	error: string | null;
	duration_ms: number | null;
}

interface UseRobotRunsOptions {
	robotName?: string;
	workflowType?: string;
	status?: RobotRun["status"];
	limit?: number;
	autoRefresh?: boolean;
	refreshInterval?: number;
}

export function useRobotRuns(options: UseRobotRunsOptions = {}) {
	const {
		robotName,
		workflowType,
		status,
		limit = 50,
		autoRefresh = true,
		refreshInterval = 30000,
	} = options;

	const [runs, setRuns] = useState<RobotRun[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [offline, setOffline] = useState(false);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	const fetchRuns = useCallback(async () => {
		setError(null);
		try {
			const params = new URLSearchParams();
			if (robotName) params.set("robot_name", robotName);
			if (workflowType) params.set("workflow_type", workflowType);
			if (status) params.set("status", status);
			params.set("limit", String(limit));

			const response = await fetch(`/api/robots/runs?${params}`);
			if (!response.ok) throw new Error(`HTTP ${response.status}`);

			const data = await response.json();
			setOffline(!!data.offline);
			setRuns(data.runs ?? []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch runs");
		} finally {
			setLoading(false);
		}
	}, [robotName, workflowType, status, limit]);

	useEffect(() => {
		fetchRuns();
		if (autoRefresh) {
			intervalRef.current = setInterval(fetchRuns, refreshInterval);
		}
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [fetchRuns, autoRefresh, refreshInterval]);

	// Stats per robot
	const statsByRobot = runs.reduce(
		(acc, run) => {
			if (!acc[run.robot_name]) {
				acc[run.robot_name] = { total: 0, success: 0, error: 0, totalDurationMs: 0, durationCount: 0 };
			}
			acc[run.robot_name].total++;
			if (run.status === "success") acc[run.robot_name].success++;
			if (run.status === "error") acc[run.robot_name].error++;
			if (run.duration_ms) {
				acc[run.robot_name].totalDurationMs += run.duration_ms;
				acc[run.robot_name].durationCount++;
			}
			return acc;
		},
		{} as Record<string, { total: number; success: number; error: number; totalDurationMs: number; durationCount: number }>
	);

	const stats = Object.entries(statsByRobot).map(([name, s]) => ({
		robotName: name,
		totalRuns: s.total,
		successRate: s.total > 0 ? Math.round((s.success / s.total) * 100) : 0,
		avgDurationMs: s.durationCount > 0 ? Math.round(s.totalDurationMs / s.durationCount) : null,
	}));

	return {
		runs,
		loading,
		error,
		offline,
		stats,
		refresh: fetchRuns,
	};
}
