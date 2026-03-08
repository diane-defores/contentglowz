"use client";

import { FolderGit2, Loader2, Lock, Search, AlertCircle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { GitHubConnectPrompt } from "./github-connect-prompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface GitHubRepo {
	id: number;
	name: string;
	full_name: string;
	html_url: string;
	description: string | null;
	private: boolean;
	owner: string;
	default_branch: string;
	language: string | null;
	updated_at: string;
	stargazers_count: number;
}

interface GitHubRepoPickerProps {
	onSelect: (repo: GitHubRepo) => void;
}

export function GitHubRepoPicker({ onSelect }: GitHubRepoPickerProps) {
	const [repos, setRepos] = useState<GitHubRepo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [notConnected, setNotConnected] = useState(false);
	const [search, setSearch] = useState("");

	const fetchRepos = useCallback(async () => {
		setLoading(true);
		setError(null);
		setNotConnected(false);
		try {
			const res = await fetch("/api/github/repos");
			if (res.status === 403) {
				setNotConnected(true);
				return;
			}
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error || "Failed to fetch repos");
			}
			const data = await res.json();
			setRepos(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch repos");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchRepos();
	}, [fetchRepos]);

	const filtered = search
		? repos.filter(
				(r) =>
					r.full_name.toLowerCase().includes(search.toLowerCase()) ||
					r.description?.toLowerCase().includes(search.toLowerCase()),
			)
		: repos;

	if (loading) {
		return (
			<div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
				<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				Loading repositories...
			</div>
		);
	}

	if (notConnected) {
		return <GitHubConnectPrompt onConnected={fetchRepos} />;
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 py-6">
				<div className="flex items-center gap-2 text-sm text-destructive">
					<AlertCircle className="h-4 w-4" />
					{error}
				</div>
				<Button variant="outline" size="sm" onClick={fetchRepos}>
					<RefreshCw className="mr-2 h-3 w-3" />
					Retry
				</Button>
			</div>
		);
	}

	return (
		<div className="grid gap-2">
			<div className="relative">
				<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Search repositories..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="pl-9"
				/>
			</div>
			<ScrollArea className="h-[240px] rounded-md border">
				{filtered.length === 0 ? (
					<div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
						{search ? "No matching repositories" : "No repositories found"}
					</div>
				) : (
					<div className="p-1">
						{filtered.map((repo) => (
							<button
								key={repo.id}
								type="button"
								onClick={() => onSelect(repo)}
								className={cn(
									"flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm",
									"hover:bg-accent hover:text-accent-foreground",
									"transition-colors",
								)}
							>
								<FolderGit2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<span className="font-medium truncate">
											{repo.full_name}
										</span>
										{repo.private && (
											<Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
										)}
										{repo.language && (
											<span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
												{repo.language}
											</span>
										)}
									</div>
									{repo.description && (
										<p className="text-xs text-muted-foreground truncate mt-0.5">
											{repo.description}
										</p>
									)}
								</div>
							</button>
						))}
					</div>
				)}
			</ScrollArea>
		</div>
	);
}
