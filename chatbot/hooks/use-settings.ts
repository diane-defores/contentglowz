"use client";

import { useCallback, useEffect, useState } from "react";

export interface UserSettings {
	id: string;
	userId: string;
	theme: "light" | "dark" | "system";
	language: string | null;
	emailNotifications: boolean;
	webhookUrl: string | null;
	apiKeys: {
		openai?: string | null;
		anthropic?: string | null;
		exa?: string | null;
		firecrawl?: string | null;
		serper?: string | null;
	} | null;
	defaultProjectId: string | null;
	dashboardLayout: {
		defaultTab?: string;
		collapsedSections?: string[];
		refreshInterval?: number;
	} | null;
	robotSettings: {
		autoRun?: boolean;
		schedules?: Record<string, string>;
		notifications?: Record<string, boolean>;
	} | null;
	createdAt: Date;
	updatedAt: Date;
}

export function useSettings() {
	const [settings, setSettings] = useState<UserSettings | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const fetchSettings = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/settings");
			if (!response.ok) {
				if (response.status === 401) {
					setSettings(null);
					return;
				}
				throw new Error("Failed to fetch settings");
			}

			const data = await response.json();
			setSettings(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch settings");
		} finally {
			setLoading(false);
		}
	}, []);

	const updateSettings = useCallback(
		async (updates: Partial<Omit<UserSettings, "id" | "userId" | "apiKeys" | "createdAt" | "updatedAt">>) => {
			setError(null);
			setSaving(true);

			try {
				const response = await fetch("/api/settings", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(updates),
				});

				if (!response.ok) throw new Error("Failed to update settings");

				const updated = await response.json();
				setSettings(updated);
				return updated;
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to update settings";
				setError(message);
				throw err;
			} finally {
				setSaving(false);
			}
		},
		[]
	);

	const updateApiKey = useCallback(
		async (provider: "openai" | "anthropic" | "exa" | "firecrawl" | "serper", apiKey: string | null) => {
			setError(null);
			setSaving(true);

			try {
				const response = await fetch("/api/settings/api-keys", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ provider, apiKey }),
				});

				if (!response.ok) throw new Error("Failed to update API key");

				const updated = await response.json();
				setSettings(updated);
				return updated;
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to update API key";
				setError(message);
				throw err;
			} finally {
				setSaving(false);
			}
		},
		[]
	);

	useEffect(() => {
		fetchSettings();
	}, [fetchSettings]);

	return {
		settings,
		loading,
		saving,
		error,
		refresh: fetchSettings,
		updateSettings,
		updateApiKey,
		clearError: () => setError(null),
	};
}
