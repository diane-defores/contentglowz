"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// --- Interfaces ---

export interface NewsletterFormData {
	name: string;
	topics: string[];
	target_audience: string;
	tone: "professional" | "casual" | "friendly" | "educational";
	competitor_emails: string[];
	include_email_insights: boolean;
	max_sections: number;
}

export interface NewsletterSection {
	title: string;
	content: string;
	order: number;
	section_type?: string;
	source_url?: string;
}

export interface NewsletterResult {
	success: boolean;
	newsletter_id: string;
	subject_line: string;
	preview_text: string;
	word_count: number;
	read_time_minutes: number;
	content: string;
	sections: NewsletterSection[];
	sources: {
		emails: string[];
		web: string[];
	};
	created_at: string;
}

export interface NewsletterJobStatus {
	job_id: string;
	status: "pending" | "running" | "completed" | "failed";
	progress: number;
	message: string | null;
	result: NewsletterResult | null;
}

export interface NewsletterHistoryItem {
	id: string;
	subject_line: string;
	preview_text: string;
	word_count: number;
	created_at: string;
	result: NewsletterResult;
}

export interface SenderInfo {
	from_email: string;
	from_name: string;
	email_count: number;
	is_newsletter: boolean;
	latest_subject: string;
	latest_date: string | null;
}

// --- Constants ---

const STORAGE_KEY = "my-robots-newsletter-history";
const MAX_HISTORY = 20;

// --- Hook ---

/**
 * Slimmed-down newsletter hook.
 * Manages: history, result display, config check, and senders scanning.
 * Generation/polling logic has moved to use-generators.ts.
 */
export function useNewsletter() {
	const [history, setHistory] = useState<NewsletterHistoryItem[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [configReady, setConfigReady] = useState<boolean | null>(null);
	const [configChecks, setConfigChecks] = useState<Record<string, boolean> | null>(null);
	const [backendReachable, setBackendReachable] = useState<boolean | null>(null);
	const [senders, setSenders] = useState<SenderInfo[]>([]);
	const [sendersLoading, setSendersLoading] = useState(false);
	const [sendersError, setSendersError] = useState<string | null>(null);
	const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);
	const [gmailEmail, setGmailEmail] = useState<string | null>(null);

	// Load history from localStorage on mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				setHistory(JSON.parse(stored));
			}
		} catch {
			// Ignore parse errors
		}
	}, []);

	// Check config readiness on mount
	useEffect(() => {
		checkConfig();
	}, []);

	// Check Gmail connection status on mount
	useEffect(() => {
		checkGmailStatus();
	}, []);

	const checkGmailStatus = useCallback(async () => {
		try {
			const res = await fetch("/api/gmail/status");
			if (res.ok) {
				const data = await res.json();
				setGmailConnected(data.connected);
				setGmailEmail(data.email || null);
			} else {
				setGmailConnected(false);
			}
		} catch {
			setGmailConnected(false);
		}
	}, []);

	const disconnectGmail = useCallback(async () => {
		try {
			await fetch("/api/gmail/disconnect", { method: "POST" });
			setGmailConnected(false);
			setGmailEmail(null);
			setSenders([]);
		} catch {
			// Ignore errors
		}
	}, []);

	const checkConfig = useCallback(async () => {
		try {
			const res = await fetch("/api/seo/api/newsletter/config/check");
			if (res.ok) {
				const data = await res.json();
				setBackendReachable(true);
				setConfigReady(data.ready);
				setConfigChecks(data.checks || null);
			} else {
				setBackendReachable(false);
				setConfigReady(false);
			}
		} catch {
			setBackendReachable(false);
			setConfigReady(false);
		}
	}, []);

	const persistHistory = useCallback((items: NewsletterHistoryItem[]) => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
		} catch {
			// Ignore storage errors
		}
	}, []);

	const saveToHistory = useCallback(
		(newsletterResult: NewsletterResult) => {
			const item: NewsletterHistoryItem = {
				id: newsletterResult.newsletter_id,
				subject_line: newsletterResult.subject_line,
				preview_text: newsletterResult.preview_text,
				word_count: newsletterResult.word_count,
				created_at: newsletterResult.created_at,
				result: newsletterResult,
			};
			setHistory((prev) => {
				const next = [item, ...prev].slice(0, MAX_HISTORY);
				persistHistory(next);
				return next;
			});
		},
		[persistHistory],
	);

	const loadFromHistory = useCallback((item: NewsletterHistoryItem) => {
		return item.result;
	}, []);

	const deleteHistoryItem = useCallback(
		(id: string) => {
			setHistory((prev) => {
				const next = prev.filter((item) => item.id !== id);
				persistHistory(next);
				return next;
			});
		},
		[persistHistory],
	);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const fetchSenders = useCallback(async (daysBack = 30) => {
		setSendersLoading(true);
		setSendersError(null);

		try {
			const res = await fetch(
				`/api/gmail/senders?days_back=${daysBack}`,
			);
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(
					data.error || `Scan failed (${res.status})`,
				);
			}
			const data = await res.json();
			setSenders(data.senders || []);
		} catch (err) {
			setSendersError(
				err instanceof Error ? err.message : "Failed to scan inbox",
			);
		} finally {
			setSendersLoading(false);
		}
	}, []);

	return {
		history,
		error,
		configReady,
		configChecks,
		backendReachable,
		saveToHistory,
		loadFromHistory,
		deleteHistoryItem,
		clearError,
		senders,
		sendersLoading,
		sendersError,
		fetchSenders,
		gmailConnected,
		gmailEmail,
		disconnectGmail,
	};
}
