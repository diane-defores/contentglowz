"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ActivityLog {
	id: string;
	userId: string;
	projectId?: string;
	action: string;
	robotId?: string;
	status: "started" | "running" | "completed" | "failed";
	details?: {
		input?: Record<string, unknown>;
		output?: Record<string, unknown>;
		error?: string;
		duration?: number;
		metadata?: Record<string, unknown>;
	};
	createdAt: Date;
	completedAt?: Date;
}

interface UseActivityOptions {
	projectId?: string;
	robotId?: string;
	status?: ActivityLog["status"];
	limit?: number;
	autoRefresh?: boolean;
	refreshInterval?: number;
}

export function useActivity(options: UseActivityOptions = {}) {
	const {
		projectId,
		robotId,
		status,
		limit = 50,
		autoRefresh = true,
		refreshInterval = 30000, // 30 seconds
	} = options;

	const [logs, setLogs] = useState<ActivityLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	const fetchLogs = useCallback(async () => {
		setError(null);

		try {
			const params = new URLSearchParams();
			if (projectId) params.set("projectId", projectId);
			if (robotId) params.set("robotId", robotId);
			if (status) params.set("status", status);
			params.set("limit", String(limit));

			const response = await fetch(`/api/activity?${params}`);
			if (!response.ok) throw new Error("Failed to fetch activity logs");

			const data = await response.json();
			setLogs(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch logs");
		} finally {
			setLoading(false);
		}
	}, [projectId, robotId, status, limit]);

	const createLog = useCallback(
		async (data: {
			action: string;
			projectId?: string;
			robotId?: string;
			details?: ActivityLog["details"];
		}) => {
			try {
				const response = await fetch("/api/activity", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						...data,
						projectId: data.projectId || projectId,
					}),
				});

				if (!response.ok) throw new Error("Failed to create activity log");

				const created = await response.json();
				setLogs((prev) => [created, ...prev].slice(0, limit));
				return created;
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to create log";
				setError(message);
				throw err;
			}
		},
		[projectId, limit]
	);

	const updateLog = useCallback(
		async (
			id: string,
			data: {
				status?: ActivityLog["status"];
				details?: ActivityLog["details"];
				completedAt?: Date;
			}
		) => {
			try {
				const response = await fetch(`/api/activity/${id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});

				if (!response.ok) throw new Error("Failed to update activity log");

				const updated = await response.json();
				setLogs((prev) => prev.map((log) => (log.id === id ? updated : log)));
				return updated;
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to update log";
				setError(message);
				throw err;
			}
		},
		[]
	);

	const completeLog = useCallback(
		async (id: string, output?: Record<string, unknown>, error?: string) => {
			const existingLog = logs.find((l) => l.id === id);
			const startTime = existingLog?.createdAt
				? new Date(existingLog.createdAt).getTime()
				: Date.now();
			const duration = Date.now() - startTime;

			return updateLog(id, {
				status: error ? "failed" : "completed",
				details: {
					...existingLog?.details,
					output,
					error,
					duration,
				},
				completedAt: new Date(),
			});
		},
		[logs, updateLog]
	);

	// Auto-refresh
	useEffect(() => {
		fetchLogs();

		if (autoRefresh) {
			intervalRef.current = setInterval(fetchLogs, refreshInterval);
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [fetchLogs, autoRefresh, refreshInterval]);

	// Stats
	const stats = {
		total: logs.length,
		running: logs.filter((l) => l.status === "running" || l.status === "started").length,
		completed: logs.filter((l) => l.status === "completed").length,
		failed: logs.filter((l) => l.status === "failed").length,
	};

	return {
		logs,
		loading,
		error,
		stats,
		refresh: fetchLogs,
		createLog,
		updateLog,
		completeLog,
		clearError: () => setError(null),
	};
}
