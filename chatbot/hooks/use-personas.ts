"use client";

import { useCallback, useEffect, useState } from "react";

export interface CustomerPersona {
	id: string;
	userId: string;
	projectId: string | null;
	name: string;
	avatar: string | null;
	demographics: {
		ageRange?: string;
		role?: string;
		industry?: string;
		experience?: string;
	} | null;
	painPoints: string[] | null;
	goals: string[] | null;
	language: {
		vocabulary?: string[];
		objections?: string[];
		triggers?: string[];
	} | null;
	contentPreferences: {
		formats?: string[];
		channels?: string[];
		frequency?: string;
	} | null;
	confidence: number | null;
	createdAt: string;
	updatedAt: string;
}

export function usePersonas(projectId?: string) {
	const [personas, setPersonas] = useState<CustomerPersona[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const fetchPersonas = useCallback(async () => {
		try {
			const params = projectId ? `?projectId=${projectId}` : "";
			const res = await fetch(`/api/psychology/personas${params}`);
			if (res.ok) {
				const data = await res.json();
				setPersonas(data);
			}
		} catch {} finally {
			setLoading(false);
		}
	}, [projectId]);

	useEffect(() => {
		setLoading(true);
		fetchPersonas();
	}, [fetchPersonas]);

	const createPersona = useCallback(
		async (input: Omit<CustomerPersona, "id" | "userId" | "createdAt" | "updatedAt">) => {
			setSaving(true);
			try {
				const res = await fetch("/api/psychology/personas", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ ...input, projectId }),
				});
				if (!res.ok) throw new Error("Failed to create persona");
				const persona = await res.json();
				setPersonas((prev) => [persona, ...prev]);
				return persona;
			} finally {
				setSaving(false);
			}
		},
		[projectId],
	);

	const updatePersona = useCallback(
		async (id: string, updates: Partial<CustomerPersona>) => {
			setSaving(true);
			try {
				const res = await fetch("/api/psychology/personas", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ id, ...updates, projectId }),
				});
				if (!res.ok) throw new Error("Failed to update persona");
				const persona = await res.json();
				setPersonas((prev) =>
					prev.map((p) => (p.id === id ? persona : p)),
				);
				return persona;
			} finally {
				setSaving(false);
			}
		},
		[projectId],
	);

	const removePersona = useCallback(async (id: string) => {
		const res = await fetch(`/api/psychology/personas?id=${id}`, {
			method: "DELETE",
		});
		if (!res.ok) throw new Error("Failed to delete persona");
		setPersonas((prev) => prev.filter((p) => p.id !== id));
	}, []);

	return {
		personas,
		loading,
		saving,
		createPersona,
		updatePersona,
		removePersona,
		refreshPersonas: fetchPersonas,
	};
}
