"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	startOfMonth,
	endOfMonth,
	addMonths,
	subMonths,
	format,
} from "date-fns";
import type {
	ContentItem,
	ContentStats,
	ContentFilters,
	StatusChangeEntry,
} from "./use-content-review";

// Re-export types for consumers
export type { ContentItem, ContentStats, ContentFilters, StatusChangeEntry };

// ─── Calendar types ─────────────────────────────────

export interface CalendarEvent {
	id: string;
	title: string;
	date: string; // YYYY-MM-DD
	datetime: string; // full ISO
	type: "content" | "schedule";
	content_type: string;
	source_robot: string;
	status: string;
}

// ─── Pipeline view ──────────────────────────────────

export type PipelineView = "calendar" | "table" | "kanban";

// ─── Color constants ────────────────────────────────

export const STATUS_COLORS: Record<string, string> = {
	todo: "bg-slate-400",
	in_progress: "bg-blue-400",
	generated: "bg-indigo-400",
	pending_review: "bg-amber-400",
	approved: "bg-green-400",
	scheduled: "bg-purple-400",
	publishing: "bg-cyan-400",
	published: "bg-emerald-500",
	rejected: "bg-orange-400",
	failed: "bg-red-400",
	archived: "bg-gray-400",
};

export const TYPE_HEX_COLORS: Record<string, string> = {
	newsletter: "#3b82f6",
	seo: "#22c55e",
	"seo-content": "#22c55e",
	article: "#a855f7",
	image: "#ec4899",
	video_script: "#f59e0b",
	manual: "#6b7280",
};

export const TYPE_LABELS: Record<string, string> = {
	newsletter: "Newsletter",
	seo: "SEO",
	"seo-content": "SEO",
	article: "Article",
	image: "Image",
	video_script: "Video",
	manual: "Manual",
};

export const STATUS_LABELS: Record<string, string> = {
	todo: "To Do",
	in_progress: "In Progress",
	generated: "Generated",
	pending_review: "Review",
	approved: "Approved",
	scheduled: "Scheduled",
	publishing: "Publishing",
	published: "Published",
	rejected: "Rejected",
	failed: "Failed",
	archived: "Archived",
};

export const VALID_TRANSITIONS: Record<string, string[]> = {
	todo: ["in_progress"],
	in_progress: ["generated", "todo"],
	generated: ["pending_review", "in_progress"],
	pending_review: ["approved", "rejected"],
	approved: ["scheduled", "pending_review"],
	scheduled: ["approved"],
};

// ─── API endpoints ──────────────────────────────────

const CONTENT_API = "/api/content";
const SCHEDULER_API = "/api/seo/api/scheduler";
const STATUS_API = "/api/seo/api/status";

// ─── Hook ───────────────────────────────────────────

function getInitialView(): PipelineView {
	if (typeof window === "undefined") return "calendar";
	return (localStorage.getItem("pipeline-view") as PipelineView) || "calendar";
}

export function usePipeline(projectId?: string) {
	// Data
	const [items, setItems] = useState<ContentItem[]>([]);
	const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
	const [stats, setStats] = useState<ContentStats>({ total: 0, byStatus: {} });

	// UI state
	const [view, setViewState] = useState<PipelineView>(getInitialView);
	const [filters, setFilters] = useState<ContentFilters>({});
	const [currentMonth, setCurrentMonth] = useState(new Date());

	// Loading / error
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const setView = useCallback((v: PipelineView) => {
		setViewState(v);
		localStorage.setItem("pipeline-view", v);
	}, []);

	// ── Fetchers ────────────────────────────────────

	const fetchItems = useCallback(async () => {
		try {
			const params = new URLSearchParams();
			const activeFilters = { ...filters, projectId };
			for (const [key, value] of Object.entries(activeFilters)) {
				if (value) params.set(key, value);
			}
			const res = await fetch(`${CONTENT_API}?${params.toString()}`);
			if (!res.ok) throw new Error("Failed to fetch content");
			setItems(await res.json());
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch content");
		}
	}, [filters, projectId]);

	const fetchStats = useCallback(async () => {
		try {
			const params = new URLSearchParams();
			if (projectId) params.set("projectId", projectId);
			const res = await fetch(`${CONTENT_API}/stats?${params.toString()}`);
			if (!res.ok) return;
			setStats(await res.json());
		} catch {
			// non-critical
		}
	}, [projectId]);

	const fetchCalendarEvents = useCallback(
		async (month: Date) => {
			try {
				const start = format(startOfMonth(month), "yyyy-MM-dd");
				const end = format(endOfMonth(month), "yyyy-MM-dd");
				const params = new URLSearchParams({ start, end });
				if (projectId) params.set("project_id", projectId);

				const res = await fetch(`${SCHEDULER_API}/calendar?${params.toString()}`);
				if (!res.ok) return;
				const data = await res.json();
				setCalendarEvents(data.events || []);
			} catch {
				// non-critical — calendar may not have data
			}
		},
		[projectId],
	);

	// ── Initial load ────────────────────────────────

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			await Promise.all([
				fetchItems(),
				fetchStats(),
				fetchCalendarEvents(currentMonth),
			]);
			setLoading(false);
		};
		load();
	}, [fetchItems, fetchStats, fetchCalendarEvents, currentMonth]);

	// ── Polling (10s) ───────────────────────────────

	useEffect(() => {
		pollRef.current = setInterval(() => {
			fetchItems();
			fetchStats();
		}, 10_000);
		return () => {
			if (pollRef.current) clearInterval(pollRef.current);
		};
	}, [fetchItems, fetchStats]);

	// ── Calendar navigation ─────────────────────────

	const navigateMonth = useCallback((dir: "prev" | "next") => {
		setCurrentMonth((prev) =>
			dir === "next" ? addMonths(prev, 1) : subMonths(prev, 1),
		);
	}, []);

	const goToToday = useCallback(() => setCurrentMonth(new Date()), []);

	// ── Actions ─────────────────────────────────────

	const refreshAll = useCallback(async () => {
		await Promise.all([
			fetchItems(),
			fetchStats(),
			fetchCalendarEvents(currentMonth),
		]);
	}, [fetchItems, fetchStats, fetchCalendarEvents, currentMonth]);

	const approveContent = useCallback(
		async (id: string, note?: string) => {
			try {
				const res = await fetch(`${CONTENT_API}/${id}/review`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ action: "approve", note }),
				});
				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.error || "Failed to approve");
				}
				await refreshAll();
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to approve");
				throw err;
			}
		},
		[refreshAll],
	);

	const rejectContent = useCallback(
		async (id: string, note: string) => {
			try {
				const res = await fetch(`${CONTENT_API}/${id}/review`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ action: "reject", note }),
				});
				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.error || "Failed to reject");
				}
				await refreshAll();
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to reject");
				throw err;
			}
		},
		[refreshAll],
	);

	const scheduleContent = useCallback(
		async (contentId: string, scheduledFor: string): Promise<boolean> => {
			try {
				const res = await fetch(
					`${STATUS_API}/content/${contentId}/schedule`,
					{
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ scheduled_for: scheduledFor, changed_by: "user" }),
					},
				);
				if (!res.ok) {
					const data = await res.json().catch(() => ({}));
					throw new Error(data.detail || "Failed to schedule");
				}
				await refreshAll();
				return true;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to schedule");
				return false;
			}
		},
		[refreshAll],
	);

	const transitionStatus = useCallback(
		async (contentId: string, toStatus: string): Promise<boolean> => {
			try {
				const res = await fetch(
					`${STATUS_API}/content/${contentId}/transition`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ to_status: toStatus, changed_by: "user" }),
					},
				);
				if (!res.ok) {
					const data = await res.json().catch(() => ({}));
					throw new Error(data.detail || "Failed to transition");
				}
				await refreshAll();
				return true;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to transition status");
				return false;
			}
		},
		[refreshAll],
	);

	const getHistory = useCallback(
		async (id: string): Promise<StatusChangeEntry[]> => {
			try {
				const res = await fetch(`${CONTENT_API}/${id}`);
				if (!res.ok) return [];
				const data = await res.json();
				return data.history || [];
			} catch {
				return [];
			}
		},
		[],
	);

	// ── Filtered calendar events (client-side) ──────

	const filteredCalendarEvents = calendarEvents.filter((e) => {
		if (filters.status && e.status !== filters.status) return false;
		if (filters.contentType && e.content_type !== filters.contentType) return false;
		if (filters.sourceRobot && e.source_robot !== filters.sourceRobot) return false;
		return true;
	});

	return {
		// Data
		items,
		calendarEvents: filteredCalendarEvents,
		stats,
		// View
		view,
		setView,
		// Filters
		filters,
		setFilters,
		// Calendar
		currentMonth,
		navigateMonth,
		goToToday,
		// State
		loading,
		error,
		clearError: useCallback(() => setError(null), []),
		// Actions
		refresh: refreshAll,
		approveContent,
		rejectContent,
		scheduleContent,
		transitionStatus,
		getHistory,
	};
}
