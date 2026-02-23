"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface CreatorProfile {
	id: string;
	userId: string;
	projectId: string | null;
	displayName: string | null;
	voice: {
		tone?: string;
		vocabulary?: string[];
		rhetoricalDevices?: string[];
		avoidWords?: string[];
	} | null;
	positioning: {
		niche?: string;
		uniqueAngle?: string;
		competitors?: string[];
		differentiators?: string[];
	} | null;
	values: string[] | null;
	currentChapterId: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreatorEntry {
	id: string;
	profileId: string;
	chapterId: string | null;
	entryType: "reflection" | "win" | "struggle" | "idea" | "pivot";
	content: string;
	tags: string[] | null;
	createdAt: string;
}

export interface NarrativeUpdate {
	id: string;
	profileId: string;
	chapterId: string | null;
	sourceEntryIds: string[] | null;
	voiceDelta: Record<string, unknown> | null;
	positioningDelta: Record<string, unknown> | null;
	narrativeSummary: string | null;
	status: "pending" | "approved" | "rejected";
	reviewedAt: string | null;
	createdAt: string;
}

export function usePsychology(projectId?: string) {
	const [profile, setProfile] = useState<CreatorProfile | null>(null);
	const [entries, setEntries] = useState<CreatorEntry[]>([]);
	const [pendingUpdates, setPendingUpdates] = useState<NarrativeUpdate[]>([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [synthesisTaskId, setSynthesisTaskId] = useState<string | null>(null);
	const pollRef = useRef<NodeJS.Timeout | null>(null);

	const fetchProfile = useCallback(async () => {
		try {
			const params = projectId ? `?projectId=${projectId}` : "";
			const res = await fetch(`/api/psychology${params}`);
			if (res.ok) {
				const data = await res.json();
				setProfile(data);
			}
		} catch {}
	}, [projectId]);

	const fetchNarrative = useCallback(async () => {
		try {
			const params = new URLSearchParams();
			if (projectId) params.set("projectId", projectId);
			params.set("status", "pending");
			const res = await fetch(`/api/psychology/narrative?${params}`);
			if (res.ok) {
				const data = await res.json();
				setEntries(data.entries || []);
				setPendingUpdates(data.updates || []);
			}
		} catch {}
	}, [projectId]);

	useEffect(() => {
		setLoading(true);
		Promise.all([fetchProfile(), fetchNarrative()]).finally(() =>
			setLoading(false),
		);
	}, [fetchProfile, fetchNarrative]);

	const submitEntry = useCallback(
		async (input: {
			entryType: CreatorEntry["entryType"];
			content: string;
			tags?: string[];
			triggerSynthesis?: boolean;
		}) => {
			setSubmitting(true);
			try {
				const res = await fetch("/api/psychology/narrative", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ projectId, ...input }),
				});
				if (!res.ok) throw new Error("Failed to submit entry");
				const data = await res.json();
				setEntries((prev) => [data.entry, ...prev]);
				if (data.synthesisTaskId) {
					setSynthesisTaskId(data.synthesisTaskId);
				}
				await fetchProfile();
				return data;
			} finally {
				setSubmitting(false);
			}
		},
		[projectId, fetchProfile],
	);

	const reviewUpdate = useCallback(
		async (updateId: string, approved: boolean) => {
			const params = projectId ? `?projectId=${projectId}` : "";
			const res = await fetch(`/api/psychology/narrative${params}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ updateId, approved }),
			});
			if (!res.ok) throw new Error("Failed to review update");
			const data = await res.json();
			setPendingUpdates((prev) => prev.filter((u) => u.id !== updateId));
			if (approved) await fetchProfile();
			return data;
		},
		[projectId, fetchProfile],
	);

	// Poll for synthesis completion
	const pollSynthesis = useCallback(
		async (taskId: string): Promise<void> => {
			if (pollRef.current) clearInterval(pollRef.current);

			return new Promise((resolve) => {
				pollRef.current = setInterval(async () => {
					try {
						const res = await fetch(
							`/api/psychology/narrative?taskId=${taskId}`,
						);
						if (!res.ok) return;
						const data = await res.json();
						if (data.status === "completed" || data.status === "failed") {
							if (pollRef.current) clearInterval(pollRef.current);
							setSynthesisTaskId(null);
							await fetchNarrative();
							resolve();
						}
					} catch {
						if (pollRef.current) clearInterval(pollRef.current);
						resolve();
					}
				}, 3000);
			});
		},
		[fetchNarrative],
	);

	useEffect(() => {
		if (synthesisTaskId) {
			pollSynthesis(synthesisTaskId);
		}
		return () => {
			if (pollRef.current) clearInterval(pollRef.current);
		};
	}, [synthesisTaskId, pollSynthesis]);

	return {
		profile,
		entries,
		pendingUpdates,
		loading,
		submitting,
		synthesisTaskId,
		submitEntry,
		reviewUpdate,
		refreshProfile: fetchProfile,
		refreshNarrative: fetchNarrative,
	};
}
