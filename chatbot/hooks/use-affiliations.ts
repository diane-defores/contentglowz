"use client";

import { useCallback, useEffect, useState } from "react";
import type { AffiliateLink } from "@/lib/db/schema";

export type AffiliationFormData = {
	name: string;
	url: string;
	category?: string;
	commission?: string;
	keywords?: string[];
	status?: "active" | "expired" | "paused";
	notes?: string;
	expiresAt?: string;
};

export function useAffiliations() {
	const [affiliations, setAffiliations] = useState<AffiliateLink[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchAffiliations = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/affiliations");
			if (!response.ok) {
				throw new Error("Failed to fetch affiliations");
			}
			const data = await response.json();
			setAffiliations(data);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to fetch affiliations";
			setError(message);
		} finally {
			setLoading(false);
		}
	}, []);

	const createAffiliation = useCallback(
		async (data: AffiliationFormData): Promise<AffiliateLink | null> => {
			setError(null);

			try {
				const response = await fetch("/api/affiliations", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});

				if (!response.ok) {
					throw new Error("Failed to create affiliation");
				}

				const created = await response.json();
				setAffiliations((prev) => [created, ...prev]);
				return created;
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Failed to create affiliation";
				setError(message);
				return null;
			}
		},
		[],
	);

	const updateAffiliation = useCallback(
		async (
			id: string,
			data: Partial<AffiliationFormData>,
		): Promise<AffiliateLink | null> => {
			setError(null);

			try {
				const response = await fetch(`/api/affiliations/${id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});

				if (!response.ok) {
					throw new Error("Failed to update affiliation");
				}

				const updated = await response.json();
				setAffiliations((prev) =>
					prev.map((a) => (a.id === id ? updated : a)),
				);
				return updated;
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Failed to update affiliation";
				setError(message);
				return null;
			}
		},
		[],
	);

	const deleteAffiliation = useCallback(async (id: string): Promise<boolean> => {
		setError(null);

		try {
			const response = await fetch(`/api/affiliations/${id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete affiliation");
			}

			setAffiliations((prev) => prev.filter((a) => a.id !== id));
			return true;
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to delete affiliation";
			setError(message);
			return false;
		}
	}, []);

	useEffect(() => {
		fetchAffiliations();
	}, [fetchAffiliations]);

	return {
		affiliations,
		loading,
		error,
		refresh: fetchAffiliations,
		createAffiliation,
		updateAffiliation,
		deleteAffiliation,
		clearError: () => setError(null),
	};
}
