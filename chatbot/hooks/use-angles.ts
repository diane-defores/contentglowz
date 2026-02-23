"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ContentAngle {
	id: string;
	userId: string;
	projectId: string | null;
	personaId: string | null;
	title: string;
	hook: string | null;
	angle: string;
	contentType: "article" | "newsletter" | "video_script" | "social_post";
	narrativeThread: string | null;
	painPointAddressed: string | null;
	confidence: number | null;
	status: "suggested" | "selected" | "used" | "dismissed";
	selectedAt: string | null;
	createdAt: string;
}

export function useAngles(projectId?: string) {
	const [angles, setAngles] = useState<ContentAngle[]>([]);
	const [loading, setLoading] = useState(true);
	const [generating, setGenerating] = useState(false);
	const pollRef = useRef<NodeJS.Timeout | null>(null);

	const fetchAngles = useCallback(async () => {
		try {
			const params = projectId ? `?projectId=${projectId}` : "";
			const res = await fetch(`/api/psychology/angles${params}`);
			if (res.ok) {
				const data = await res.json();
				setAngles(data);
			}
		} catch {} finally {
			setLoading(false);
		}
	}, [projectId]);

	useEffect(() => {
		setLoading(true);
		fetchAngles();
	}, [fetchAngles]);

	const generateAngles = useCallback(
		async (params: {
			personaId: string;
			contentType?: string;
			count?: number;
		}) => {
			setGenerating(true);
			try {
				const res = await fetch("/api/psychology/angles", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ projectId, ...params }),
				});
				if (!res.ok) throw new Error("Failed to generate angles");
				const data = await res.json();

				// If we got a task_id, poll for completion
				if (data.task_id) {
					await pollForCompletion(data.task_id);
				}

				await fetchAngles();
				return data;
			} finally {
				setGenerating(false);
			}
		},
		[projectId, fetchAngles],
	);

	const pollForCompletion = useCallback(
		async (taskId: string): Promise<void> => {
			return new Promise((resolve) => {
				pollRef.current = setInterval(async () => {
					try {
						const res = await fetch(
							`/api/psychology/angles?taskId=${taskId}`,
						);
						if (!res.ok) return;
						const data = await res.json();
						if (data.status === "completed" || data.status === "failed") {
							if (pollRef.current) clearInterval(pollRef.current);
							resolve();
						}
					} catch {
						if (pollRef.current) clearInterval(pollRef.current);
						resolve();
					}
				}, 3000);
			});
		},
		[],
	);

	const selectAngle = useCallback(
		async (id: string, status: "selected" | "used" | "dismissed") => {
			const res = await fetch("/api/psychology/angles", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id, status }),
			});
			if (!res.ok) throw new Error("Failed to update angle");
			const updated = await res.json();
			setAngles((prev) =>
				prev.map((a) => (a.id === id ? updated : a)),
			);
			return updated;
		},
		[],
	);

	useEffect(() => {
		return () => {
			if (pollRef.current) clearInterval(pollRef.current);
		};
	}, []);

	return {
		angles,
		loading,
		generating,
		generateAngles,
		selectAngle,
		refreshAngles: fetchAngles,
	};
}
