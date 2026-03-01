"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────

export interface ContentItem {
	id: string;
	title: string;
	contentType: string;
	sourceRobot: string;
	status: string;
	projectId: string | null;
	contentPath: string | null;
	contentPreview: string | null;
	contentHash: string | null;
	priority: number;
	tags: string[] | null;
	metadata: Record<string, unknown> | null;
	normalizedMetadata?: {
		funnelStage: "tofu" | "mofu" | "bofu" | "retention";
		contentStatus:
			| "draft"
			| "in_review"
			| "approved"
			| "scheduled"
			| "published"
			| "archived";
		robotStatus: Record<
			| "brief"
			| "writing"
			| "internalLinking"
			| "imageGeneration"
			| "seoValidation"
			| "cmsSync",
			"pending" | "in_progress" | "done" | "failed" | "skipped"
		>;
		metaTitle?: string;
		metaDescription?: string;
	};
	metadataAudit?: {
		score: number;
		errorCount: number;
		warnCount: number;
		infoCount: number;
		robotProgress: {
			total: number;
			done: number;
			failed: number;
			pending: number;
		};
	};
	targetUrl: string | null;
	reviewerNote: string | null;
	reviewedBy: string | null;
	createdAt: string;
	updatedAt: string;
	scheduledFor: string | null;
	publishedAt: string | null;
	syncedAt: string | null;
}

export interface ContentStats {
	total: number;
	byStatus: Record<string, number>;
}

export interface ContentFilters {
	status?: string;
	contentType?: string;
	sourceRobot?: string;
	projectId?: string;
	funnelStage?: "tofu" | "mofu" | "bofu" | "retention";
}

export interface StatusChangeEntry {
	id: string;
	contentId: string;
	fromStatus: string;
	toStatus: string;
	changedBy: string;
	reason: string | null;
	timestamp: string;
}

// ─── API Base ────────────────────────────────────────

const API_BASE = "/api/content";

// ─── Hook ────────────────────────────────────────────

export function useContentReview(projectId?: string) {
	const [items, setItems] = useState<ContentItem[]>([]);
	const [stats, setStats] = useState<ContentStats>({ total: 0, byStatus: {} });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filters, setFilters] = useState<ContentFilters>({});
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Fetch content records with current filters
	const fetchItems = useCallback(async () => {
		try {
			const params = new URLSearchParams();
			const activeFilters = { ...filters, projectId };

			for (const [key, value] of Object.entries(activeFilters)) {
				if (value) params.set(key, value);
			}

			const res = await fetch(`${API_BASE}?${params.toString()}`);
			if (!res.ok) throw new Error("Failed to fetch content");
			const data = await res.json();
			setItems(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch content");
		}
	}, [filters, projectId]);

	// Fetch stats
	const fetchStats = useCallback(async () => {
		try {
			const params = new URLSearchParams();
			if (projectId) params.set("projectId", projectId);

			const res = await fetch(`${API_BASE}/stats?${params.toString()}`);
			if (!res.ok) throw new Error("Failed to fetch stats");
			const data = await res.json();
			setStats(data);
		} catch {
			// Stats errors are non-critical
		}
	}, [projectId]);

	// Initial load
	useEffect(() => {
		const load = async () => {
			setLoading(true);
			await Promise.all([fetchItems(), fetchStats()]);
			setLoading(false);
		};
		load();
	}, [fetchItems, fetchStats]);

	// Auto-refresh every 10s for pending_review items
	useEffect(() => {
		pollRef.current = setInterval(() => {
			fetchItems();
			fetchStats();
		}, 10_000);

		return () => {
			if (pollRef.current) clearInterval(pollRef.current);
		};
	}, [fetchItems, fetchStats]);

	// Approve content
	const approveContent = useCallback(
		async (id: string, note?: string) => {
			try {
				const res = await fetch(`${API_BASE}/${id}/review`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ action: "approve", note }),
				});
				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.error || "Failed to approve");
				}
				await Promise.all([fetchItems(), fetchStats()]);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to approve content",
				);
				throw err;
			}
		},
		[fetchItems, fetchStats],
	);

	// Reject content
	const rejectContent = useCallback(
		async (id: string, note: string) => {
			try {
				const res = await fetch(`${API_BASE}/${id}/review`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ action: "reject", note }),
				});
				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.error || "Failed to reject");
				}
				await Promise.all([fetchItems(), fetchStats()]);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to reject content",
				);
				throw err;
			}
		},
		[fetchItems, fetchStats],
	);

	// Get history for a specific record
	const getHistory = useCallback(
		async (id: string): Promise<StatusChangeEntry[]> => {
			try {
				const res = await fetch(`${API_BASE}/${id}`);
				if (!res.ok) throw new Error("Failed to fetch history");
				const data = await res.json();
				return data.history || [];
			} catch {
				return [];
			}
		},
		[],
	);

	const clearError = useCallback(() => setError(null), []);

	const refresh = useCallback(async () => {
		await Promise.all([fetchItems(), fetchStats()]);
	}, [fetchItems, fetchStats]);

	return {
		items,
		stats,
		loading,
		error,
		filters,
		setFilters,
		approveContent,
		rejectContent,
		getHistory,
		clearError,
		refresh,
	};
}
