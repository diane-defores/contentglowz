"use client";

import { useCallback, useState } from "react";

// ─── Types ───────────────────────────────────────────

export interface ContentBodyData {
	id: string;
	content_id: string;
	body: string;
	version: number;
	edited_by: string | null;
	edit_note: string | null;
	created_at: string;
}

export interface ContentEditEntry {
	id: string;
	content_id: string;
	edited_by: string;
	edit_note: string | null;
	previous_version: number;
	new_version: number;
	created_at: string;
}

// ─── API Base ────────────────────────────────────────

const API_BASE = "/api/seo/api/status/content";

// ─── Hook ────────────────────────────────────────────

export function useContentEditor(contentId: string) {
	const [body, setBody] = useState<ContentBodyData | null>(null);
	const [history, setHistory] = useState<ContentEditEntry[]>([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchBody = useCallback(
		async (version?: number) => {
			setLoading(true);
			setError(null);
			try {
				const params = version !== undefined ? `?version=${version}` : "";
				const res = await fetch(
					`${API_BASE}/${contentId}/body${params}`,
				);
				if (res.status === 404) {
					setBody(null);
					return null;
				}
				if (!res.ok) throw new Error("Failed to fetch content body");
				const data: ContentBodyData = await res.json();
				setBody(data);
				return data;
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Failed to fetch content body",
				);
				return null;
			} finally {
				setLoading(false);
			}
		},
		[contentId],
	);

	const saveBody = useCallback(
		async (newBody: string, editNote?: string) => {
			setSaving(true);
			setError(null);
			try {
				const res = await fetch(`${API_BASE}/${contentId}/body`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						body: newBody,
						edited_by: "user",
						edit_note: editNote || null,
					}),
				});
				if (!res.ok) {
					const data = await res.json().catch(() => ({}));
					throw new Error(data.detail || "Failed to save content");
				}
				const saved: ContentBodyData = await res.json();
				setBody(saved);
				return saved;
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to save",
				);
				return null;
			} finally {
				setSaving(false);
			}
		},
		[contentId],
	);

	const fetchHistory = useCallback(async () => {
		setError(null);
		try {
			const res = await fetch(
				`${API_BASE}/${contentId}/body/history`,
			);
			if (!res.ok) throw new Error("Failed to fetch edit history");
			const data: ContentEditEntry[] = await res.json();
			setHistory(data);
			return data;
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to fetch history",
			);
			return [];
		}
	}, [contentId]);

	const regenerate = useCallback(
		async (instructions?: string) => {
			setError(null);
			try {
				const res = await fetch(
					`${API_BASE}/${contentId}/regenerate`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							instructions: instructions || null,
							changed_by: "user",
						}),
					},
				);
				if (!res.ok) {
					const data = await res.json().catch(() => ({}));
					throw new Error(
						data.detail || "Failed to send for re-generation",
					);
				}
				return await res.json();
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Failed to regenerate",
				);
				return null;
			}
		},
		[contentId],
	);

	const clearError = useCallback(() => setError(null), []);

	return {
		body,
		history,
		loading,
		saving,
		error,
		fetchBody,
		saveBody,
		fetchHistory,
		regenerate,
		clearError,
	};
}
