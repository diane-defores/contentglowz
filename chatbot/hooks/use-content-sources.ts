"use client";

import { useCallback, useEffect, useState } from "react";
import type { ContentSource } from "@/lib/db/schema";

export function useContentSources(projectId?: string) {
	const [sources, setSources] = useState<ContentSource[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchSources = useCallback(async () => {
		if (!projectId) {
			setSources([]);
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const params = new URLSearchParams({ projectId });
			const res = await fetch(`/api/content-sources?${params}`);

			if (!res.ok) {
				// Table may not exist yet — treat as empty rather than error
				if (res.status === 500) {
					setSources([]);
					return;
				}
				throw new Error("Failed to fetch content sources");
			}

			const data = await res.json();
			setSources(data);
		} catch (err) {
			// Silently degrade — content sources are optional
			console.warn("[use-content-sources] fetch error:", err);
			setSources([]);
		} finally {
			setLoading(false);
		}
	}, [projectId]);

	const createSource = useCallback(
		async (
			data: Omit<
				ContentSource,
				"id" | "userId" | "createdAt" | "updatedAt" | "status" | "lastSyncedAt"
			>,
		) => {
			setError(null);
			try {
				const res = await fetch("/api/content-sources", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});
				if (!res.ok) {
					const errData = await res.json().catch(() => ({}));
					throw new Error(
						errData.details ||
							errData.error ||
							"Failed to create content source",
					);
				}
				const created = await res.json();
				setSources((prev) => [created, ...prev]);
				return created as ContentSource;
			} catch (err) {
				const message =
					err instanceof Error
						? err.message
						: "Failed to create content source";
				setError(message);
				throw err;
			}
		},
		[],
	);

	const updateSource = useCallback(
		async (id: string, data: Partial<ContentSource>) => {
			setError(null);
			try {
				const res = await fetch(`/api/content-sources/${id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});
				if (!res.ok) {
					const errData = await res.json().catch(() => ({}));
					throw new Error(
						errData.details ||
							errData.error ||
							"Failed to update content source",
					);
				}
				const updated = await res.json();
				setSources((prev) => prev.map((s) => (s.id === id ? updated : s)));
				return updated as ContentSource;
			} catch (err) {
				const message =
					err instanceof Error
						? err.message
						: "Failed to update content source";
				setError(message);
				throw err;
			}
		},
		[],
	);

	const deleteSource = useCallback(async (id: string) => {
		setError(null);
		try {
			const res = await fetch(`/api/content-sources/${id}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(
					errData.details || errData.error || "Failed to delete content source",
				);
			}
			setSources((prev) => prev.filter((s) => s.id !== id));
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to delete content source";
			setError(message);
			throw err;
		}
	}, []);

	const syncSource = useCallback(
		async (id: string) => {
			setError(null);
			try {
				const res = await fetch("/api/content/sync", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ sourceId: id }),
				});
				if (!res.ok) {
					const errData = await res.json().catch(() => ({}));
					throw new Error(
						errData.error ||
							errData.details ||
							"Failed to sync content source metadata",
					);
				}
				await fetchSources();
				return await res.json();
			} catch (err) {
				const message =
					err instanceof Error
						? err.message
						: "Failed to sync content source metadata";
				setError(message);
				throw err;
			}
		},
		[fetchSources],
	);

	const syncAllSources = useCallback(async () => {
		if (!projectId) {
			throw new Error("Missing projectId");
		}

		setError(null);
		try {
			const res = await fetch("/api/content/sync", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ projectId }),
			});
			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(
					errData.error ||
						errData.details ||
						"Failed to sync content source metadata",
				);
			}
			await fetchSources();
			return await res.json();
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Failed to sync content source metadata";
			setError(message);
			throw err;
		}
	}, [fetchSources, projectId]);

	useEffect(() => {
		fetchSources();
	}, [fetchSources]);

	return {
		sources,
		loading,
		error,
		refresh: fetchSources,
		createSource,
		updateSource,
		deleteSource,
		syncSource,
		syncAllSources,
	};
}
