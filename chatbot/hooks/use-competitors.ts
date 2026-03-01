"use client";

import { useCallback, useEffect, useState } from "react";
import type { Competitor } from "@/lib/db/schema";

export type CompetitorFormData = {
	name: string;
	url: string;
	niche?: string;
	priority?: "high" | "medium" | "low";
	notes?: string;
	projectId?: string;
};

export function useCompetitors(projectId?: string) {
	const [competitors, setCompetitors] = useState<Competitor[]>([]);
	const [loading, setLoading] = useState(true);
	const [analyzing, setAnalyzing] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const fetchCompetitors = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const url = projectId
				? `/api/competitors?projectId=${projectId}`
				: "/api/competitors";
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error("Failed to fetch competitors");
			}
			const data = await response.json();
			setCompetitors(data);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to fetch competitors";
			setError(message);
		} finally {
			setLoading(false);
		}
	}, [projectId]);

	const createCompetitor = useCallback(
		async (data: CompetitorFormData): Promise<Competitor | null> => {
			setError(null);

			try {
				const response = await fetch("/api/competitors", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ ...data, projectId: data.projectId || projectId }),
				});

				if (!response.ok) {
					throw new Error("Failed to create competitor");
				}

				const created = await response.json();
				setCompetitors((prev) => [created, ...prev]);

				// Auto-trigger analysis in the background (fire-and-forget)
				if (created?.id) {
					setAnalyzing(created.id);
					fetch(`/api/competitors/${created.id}/analyze`, { method: "POST" })
						.then(async (r) => {
							if (r.ok) {
								const { competitor: updated } = await r.json();
								setCompetitors((prev) =>
									prev.map((c) => (c.id === created.id ? updated : c)),
								);
							}
						})
						.catch(() => {
							// Silently ignore background analysis errors
						})
						.finally(() => {
							setAnalyzing(null);
						});
				}

				return created;
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Failed to create competitor";
				setError(message);
				return null;
			}
		},
		[projectId],
	);

	const updateCompetitor = useCallback(
		async (
			id: string,
			data: Partial<CompetitorFormData>,
		): Promise<Competitor | null> => {
			setError(null);

			try {
				const response = await fetch(`/api/competitors/${id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});

				if (!response.ok) {
					throw new Error("Failed to update competitor");
				}

				const updated = await response.json();
				setCompetitors((prev) =>
					prev.map((c) => (c.id === id ? updated : c)),
				);
				return updated;
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Failed to update competitor";
				setError(message);
				return null;
			}
		},
		[],
	);

	const deleteCompetitor = useCallback(async (id: string): Promise<boolean> => {
		setError(null);

		try {
			const response = await fetch(`/api/competitors/${id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete competitor");
			}

			setCompetitors((prev) => prev.filter((c) => c.id !== id));
			return true;
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to delete competitor";
			setError(message);
			return false;
		}
	}, []);

	const analyzeCompetitor = useCallback(
		async (id: string): Promise<Competitor | null> => {
			setError(null);
			setAnalyzing(id);

			try {
				const response = await fetch(`/api/competitors/${id}/analyze`, {
					method: "POST",
				});

				if (!response.ok) {
					const data = await response.json();
					throw new Error(data.error || "Failed to analyze competitor");
				}

				const { competitor: updated } = await response.json();
				setCompetitors((prev) =>
					prev.map((c) => (c.id === id ? updated : c)),
				);
				return updated;
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Failed to analyze competitor";
				setError(message);
				return null;
			} finally {
				setAnalyzing(null);
			}
		},
		[],
	);

	useEffect(() => {
		fetchCompetitors();
	}, [fetchCompetitors, projectId]);

	return {
		competitors,
		loading,
		analyzing,
		error,
		refresh: fetchCompetitors,
		createCompetitor,
		updateCompetitor,
		deleteCompetitor,
		analyzeCompetitor,
		clearError: () => setError(null),
	};
}
