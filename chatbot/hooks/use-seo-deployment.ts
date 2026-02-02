"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface DeploymentOptions {
	dryRun: boolean;
	noDeploy: boolean;
	targetRepo?: string;
}

export interface StepInfo {
	name: string;
	status: "pending" | "running" | "completed" | "error";
	started_at?: string;
	completed_at?: string;
	duration_seconds?: number;
}

export interface BatchProgress {
	completed: number;
	total: number;
	current_topic?: string;
}

export interface DeploymentStatus {
	running: boolean;
	job_id?: string;
	job_type?: "single" | "batch";
	topic?: string;
	current_step?: string;
	progress: number;
	steps: StepInfo[];
	batch_progress?: BatchProgress;
	error?: string;
}

export interface LogEntry {
	timestamp: string;
	level: "info" | "warning" | "error";
	step?: string;
	message: string;
}

export interface Schedule {
	id: string;
	schedule_type: "daily" | "weekly" | "custom";
	cron_expression: string;
	topics: string[];
	enabled: boolean;
	next_run?: string;
	last_run?: string;
	last_status?: string;
}

export interface UseSEODeploymentReturn {
	status: DeploymentStatus;
	logs: LogEntry[];
	schedules: Schedule[];
	loading: boolean;
	error: string | null;
	runDeployment: (topic: string, options: DeploymentOptions) => Promise<void>;
	runBatch: (topics: string[], delaySeconds: number) => Promise<void>;
	stopDeployment: () => Promise<void>;
	fetchLogs: (level?: string) => Promise<void>;
	createSchedule: (input: Omit<Schedule, "id">) => Promise<void>;
	deleteSchedule: (id: string) => Promise<void>;
	toggleSchedule: (id: string, enabled: boolean) => Promise<void>;
	refreshStatus: () => Promise<boolean>;
}

const API_BASE = "/api/seo/api/deployment";

export function useSEODeployment(): UseSEODeploymentReturn {
	const [status, setStatus] = useState<DeploymentStatus>({
		running: false,
		progress: 0,
		steps: [],
	});
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [schedules, setSchedules] = useState<Schedule[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const pollRef = useRef<NodeJS.Timeout | null>(null);

	const fetchStatus = useCallback(async (): Promise<boolean> => {
		try {
			const res = await fetch(`${API_BASE}/status`);
			if (res.ok) {
				const data = await res.json();
				setStatus(data);
				return data.running;
			}
		} catch (e) {
			console.error("Failed to fetch status:", e);
		}
		return false;
	}, []);

	const startPolling = useCallback(() => {
		if (pollRef.current) return;
		pollRef.current = setInterval(async () => {
			const running = await fetchStatus();
			if (!running && pollRef.current) {
				clearInterval(pollRef.current);
				pollRef.current = null;
			}
		}, 2000);
	}, [fetchStatus]);

	const stopPolling = useCallback(() => {
		if (pollRef.current) {
			clearInterval(pollRef.current);
			pollRef.current = null;
		}
	}, []);

	const runDeployment = useCallback(
		async (topic: string, options: DeploymentOptions) => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(`${API_BASE}/run`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						topic,
						dry_run: options.dryRun,
						no_deploy: options.noDeploy,
						target_repo: options.targetRepo || null,
					}),
				});
				if (!res.ok) {
					const data = await res.json().catch(() => ({}));
					throw new Error(data.detail || "Failed to start deployment");
				}
				startPolling();
			} catch (e) {
				const message = e instanceof Error ? e.message : "Deployment failed";
				setError(message);
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[startPolling]
	);

	const runBatch = useCallback(
		async (topics: string[], delaySeconds: number) => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(`${API_BASE}/batch`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						topics,
						delay_seconds: delaySeconds,
						auto_deploy: true,
					}),
				});
				if (!res.ok) {
					const data = await res.json().catch(() => ({}));
					throw new Error(data.detail || "Failed to start batch");
				}
				startPolling();
			} catch (e) {
				const message = e instanceof Error ? e.message : "Batch failed";
				setError(message);
				throw e;
			} finally {
				setLoading(false);
			}
		},
		[startPolling]
	);

	const stopDeployment = useCallback(async () => {
		try {
			await fetch(`${API_BASE}/stop`, { method: "POST" });
			stopPolling();
			await fetchStatus();
		} catch (e) {
			console.error("Failed to stop deployment:", e);
		}
	}, [fetchStatus, stopPolling]);

	const fetchLogs = useCallback(async (level?: string) => {
		try {
			const url = level
				? `${API_BASE}/logs?level=${level}`
				: `${API_BASE}/logs`;
			const res = await fetch(url);
			if (res.ok) {
				setLogs(await res.json());
			}
		} catch (e) {
			console.error("Failed to fetch logs:", e);
		}
	}, []);

	const fetchSchedules = useCallback(async () => {
		try {
			const res = await fetch(`${API_BASE}/schedules`);
			if (res.ok) {
				setSchedules(await res.json());
			}
		} catch (e) {
			console.error("Failed to fetch schedules:", e);
		}
	}, []);

	const createSchedule = useCallback(
		async (input: Omit<Schedule, "id">) => {
			try {
				const res = await fetch(`${API_BASE}/schedules`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						schedule_type: input.schedule_type,
						cron_expression: input.cron_expression,
						topics: input.topics,
						enabled: input.enabled,
					}),
				});
				if (res.ok) {
					await fetchSchedules();
				}
			} catch (e) {
				console.error("Failed to create schedule:", e);
			}
		},
		[fetchSchedules]
	);

	const deleteSchedule = useCallback(
		async (id: string) => {
			try {
				await fetch(`${API_BASE}/schedules/${id}`, { method: "DELETE" });
				await fetchSchedules();
			} catch (e) {
				console.error("Failed to delete schedule:", e);
			}
		},
		[fetchSchedules]
	);

	const toggleSchedule = useCallback(
		async (id: string, enabled: boolean) => {
			try {
				await fetch(`${API_BASE}/schedules/${id}?enabled=${enabled}`, {
					method: "PATCH",
				});
				await fetchSchedules();
			} catch (e) {
				console.error("Failed to toggle schedule:", e);
			}
		},
		[fetchSchedules]
	);

	useEffect(() => {
		fetchStatus();
		fetchSchedules();
		return () => {
			stopPolling();
		};
	}, [fetchStatus, fetchSchedules, stopPolling]);

	return {
		status,
		logs,
		schedules,
		loading,
		error,
		runDeployment,
		runBatch,
		stopDeployment,
		fetchLogs,
		createSchedule,
		deleteSchedule,
		toggleSchedule,
		refreshStatus: fetchStatus,
	};
}
