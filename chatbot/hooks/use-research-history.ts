"use client";

import { useCallback, useEffect, useState } from "react";

export interface ResearchChat {
	id: string;
	title: string;
	createdAt: string;
	projectId?: string;
}

export function useResearchHistory(projectId?: string) {
	const [chats, setChats] = useState<ResearchChat[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchHistory = useCallback(async () => {
		setLoading(true);
		try {
			const url = projectId
				? `/api/research/history?projectId=${projectId}`
				: "/api/research/history";
			const res = await fetch(url);
			if (!res.ok) throw new Error("Failed to fetch");
			const data = await res.json();
			setChats(data);
		} catch {
			setChats([]);
		} finally {
			setLoading(false);
		}
	}, [projectId]);

	const deleteChat = useCallback(async (id: string) => {
		try {
			const res = await fetch(`/api/research/history?id=${id}`, {
				method: "DELETE",
			});
			if (res.ok) {
				setChats((prev) => prev.filter((c) => c.id !== id));
			}
		} catch {
			// silently fail
		}
	}, []);

	useEffect(() => {
		fetchHistory();
	}, [fetchHistory]);

	return { chats, loading, refresh: fetchHistory, deleteChat };
}
