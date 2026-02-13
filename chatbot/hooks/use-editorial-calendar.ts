"use client";

import { useCallback, useEffect, useState } from "react";
import {
	startOfMonth,
	endOfMonth,
	addMonths,
	subMonths,
	format,
} from "date-fns";

// ─── Types ───────────────────────────────────────────

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

export interface CalendarData {
	events: CalendarEvent[];
	total: number;
}

// ─── API Base ────────────────────────────────────────

const API_BASE = "/api/seo/api/scheduler";
const STATUS_API = "/api/seo/api/status";

// ─── Hook ────────────────────────────────────────────

export function useEditorialCalendar(projectId?: string) {
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [events, setEvents] = useState<CalendarEvent[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchEvents = useCallback(
		async (month: Date) => {
			setLoading(true);
			setError(null);
			try {
				const start = format(startOfMonth(month), "yyyy-MM-dd");
				const end = format(endOfMonth(month), "yyyy-MM-dd");

				const params = new URLSearchParams({ start, end });
				if (projectId) params.set("project_id", projectId);

				const res = await fetch(
					`${API_BASE}/calendar?${params.toString()}`,
				);
				if (!res.ok) throw new Error("Failed to fetch calendar events");
				const data: CalendarData = await res.json();
				setEvents(data.events);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Failed to load calendar",
				);
			} finally {
				setLoading(false);
			}
		},
		[projectId],
	);

	// Fetch events when month changes
	useEffect(() => {
		fetchEvents(currentMonth);
	}, [currentMonth, fetchEvents]);

	const navigateMonth = useCallback(
		(direction: "prev" | "next") => {
			setCurrentMonth((prev) =>
				direction === "next" ? addMonths(prev, 1) : subMonths(prev, 1),
			);
		},
		[],
	);

	const goToToday = useCallback(() => {
		setCurrentMonth(new Date());
	}, []);

	const scheduleContent = useCallback(
		async (contentId: string, scheduledFor: string) => {
			setError(null);
			try {
				const res = await fetch(
					`${STATUS_API}/content/${contentId}/schedule`,
					{
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							scheduled_for: scheduledFor,
							changed_by: "user",
						}),
					},
				);
				if (!res.ok) {
					const data = await res.json().catch(() => ({}));
					throw new Error(data.detail || "Failed to schedule content");
				}
				// Refresh events
				await fetchEvents(currentMonth);
				return true;
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Failed to schedule content",
				);
				return false;
			}
		},
		[currentMonth, fetchEvents],
	);

	const refresh = useCallback(() => {
		fetchEvents(currentMonth);
	}, [currentMonth, fetchEvents]);

	const clearError = useCallback(() => setError(null), []);

	return {
		currentMonth,
		events,
		loading,
		error,
		navigateMonth,
		goToToday,
		scheduleContent,
		refresh,
		clearError,
	};
}
