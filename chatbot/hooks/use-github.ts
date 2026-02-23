"use client";

import { useCallback, useEffect, useState } from "react";

export interface GitHubTreeEntry {
	name: string;
	path: string;
	type: "file" | "dir";
	size?: number;
	sha: string;
}

export function useGitHub() {
	const [connected, setConnected] = useState<boolean | null>(null);
	const [loading, setLoading] = useState(true);

	const checkConnection = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/github/status");
			if (res.ok) {
				const data = await res.json();
				setConnected(data.connected);
			} else {
				setConnected(false);
			}
		} catch {
			setConnected(false);
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchTree = useCallback(
		async (
			owner: string,
			repo: string,
			path?: string,
			filter?: "markdown",
		): Promise<GitHubTreeEntry[]> => {
			const params = new URLSearchParams({ owner, repo });
			if (path) params.set("path", path);
			if (filter) params.set("filter", filter);

			const res = await fetch(`/api/github/tree?${params}`);
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || "Failed to fetch tree");
			}
			return res.json();
		},
		[],
	);

	const fetchFile = useCallback(
		async (
			owner: string,
			repo: string,
			path: string,
		): Promise<{ content: string; sha: string }> => {
			const params = new URLSearchParams({ owner, repo, path });
			const res = await fetch(`/api/github/file?${params}`);
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || "Failed to fetch file");
			}
			return res.json();
		},
		[],
	);

	const saveFile = useCallback(
		async (
			owner: string,
			repo: string,
			path: string,
			content: string,
			sha: string,
			message: string,
			branch?: string,
		): Promise<{ sha: string; commitSha: string }> => {
			const res = await fetch("/api/github/file", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					owner,
					repo,
					path,
					content,
					sha,
					message,
					branch,
				}),
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				const error = new Error(
					err.error || "Failed to save file",
				) as Error & { status?: number };
				error.status = res.status;
				throw error;
			}
			return res.json();
		},
		[],
	);

	useEffect(() => {
		checkConnection();
	}, [checkConnection]);

	return {
		connected,
		loading,
		checkConnection,
		fetchTree,
		fetchFile,
		saveFile,
	};
}
