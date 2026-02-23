"use client";

import { AlertTriangle, ChevronDown, ChevronRight, FileText, Folder, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useGitHub, type GitHubTreeEntry } from "@/hooks/use-github";
import { cn } from "@/lib/utils";

interface GitHubTreeBrowserProps {
	owner: string;
	repo: string;
	basePath?: string;
	filterMarkdown?: boolean;
	onFileSelect?: (path: string, sha: string) => void;
	onPathSelect?: (path: string) => void;
	/** Called when a folder is expanded/collapsed — reports the last interacted folder path */
	onFolderSelect?: (path: string) => void;
	selectionMode?: "file" | "directory";
	onReconnect?: () => void;
}

export function GitHubTreeBrowser({
	owner,
	repo,
	basePath,
	filterMarkdown = true,
	onFileSelect,
	onPathSelect,
	onFolderSelect,
	selectionMode = "file",
	onReconnect,
}: GitHubTreeBrowserProps) {
	const { fetchTree } = useGitHub();
	const [treeData, setTreeData] = useState<Map<string, GitHubTreeEntry[]>>(
		new Map(),
	);
	const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
		new Set(),
	);
	const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());
	const [selectedPath, setSelectedPath] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const loadDirectory = useCallback(
		async (path: string) => {
			if (treeData.has(path)) return;

			setLoadingPaths((prev) => new Set(prev).add(path));
			setError(null);

			try {
				const entries = await fetchTree(
					owner,
					repo,
					path || undefined,
					filterMarkdown ? "markdown" : undefined,
				);
				setTreeData((prev) => new Map(prev).set(path, entries));
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Failed to load directory",
				);
			} finally {
				setLoadingPaths((prev) => {
					const next = new Set(prev);
					next.delete(path);
					return next;
				});
			}
		},
		[owner, repo, filterMarkdown, fetchTree, treeData],
	);

	// Load initial directory
	useEffect(() => {
		const initialPath = basePath || "";
		loadDirectory(initialPath);
		if (initialPath) {
			setExpandedPaths(new Set([initialPath]));
		}
	}, [owner, repo, basePath]);

	const toggleFolder = useCallback(
		(path: string) => {
			setExpandedPaths((prev) => {
				const next = new Set(prev);
				if (next.has(path)) {
					next.delete(path);
				} else {
					next.add(path);
					loadDirectory(path);
				}
				return next;
			});

			onFolderSelect?.(path);

			if (selectionMode === "directory") {
				setSelectedPath(path);
				onPathSelect?.(path);
			}
		},
		[selectionMode, onPathSelect, onFolderSelect, loadDirectory],
	);

	const handleFileClick = useCallback(
		(entry: GitHubTreeEntry) => {
			if (selectionMode === "file") {
				setSelectedPath(entry.path);
				onFileSelect?.(entry.path, entry.sha);
			}
		},
		[selectionMode, onFileSelect],
	);

	const renderEntry = (
		entry: GitHubTreeEntry,
		depth: number,
	): React.ReactNode => {
		const isExpanded = expandedPaths.has(entry.path);
		const isLoading = loadingPaths.has(entry.path);
		const isSelected = selectedPath === entry.path;
		const children = treeData.get(entry.path);

		if (entry.type === "dir") {
			return (
				<div key={entry.path}>
					<button
						onClick={() => toggleFolder(entry.path)}
						className={cn(
							"flex items-center gap-1.5 w-full text-left py-1 px-2 text-sm hover:bg-accent rounded-sm",
							isSelected &&
								selectionMode === "directory" &&
								"bg-accent text-accent-foreground",
						)}
						style={{ paddingLeft: `${depth * 16 + 8}px` }}
					>
						{isLoading ? (
							<Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
						) : isExpanded ? (
							<ChevronDown className="h-3.5 w-3.5 shrink-0" />
						) : (
							<ChevronRight className="h-3.5 w-3.5 shrink-0" />
						)}
						<Folder className="h-3.5 w-3.5 shrink-0 text-blue-500" />
						<span className="truncate">{entry.name}</span>
					</button>
					{isExpanded && children && (
						<div>
							{children.map((child) =>
								renderEntry(child, depth + 1),
							)}
						</div>
					)}
				</div>
			);
		}

		return (
			<button
				key={entry.path}
				onClick={() => handleFileClick(entry)}
				className={cn(
					"flex items-center gap-1.5 w-full text-left py-1 px-2 text-sm hover:bg-accent rounded-sm",
					isSelected &&
						selectionMode === "file" &&
						"bg-accent text-accent-foreground",
				)}
				style={{ paddingLeft: `${depth * 16 + 8}px` }}
			>
				<span className="w-3.5" />
				<FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
				<span className="truncate">{entry.name}</span>
			</button>
		);
	};

	const rootPath = basePath || "";
	const rootEntries = treeData.get(rootPath);
	const isRootLoading = loadingPaths.has(rootPath);

	if (error) {
		const isAccessError =
			error.includes("access") ||
			error.includes("scope") ||
			error.includes("not find") ||
			error.includes("denied");

		return (
			<div className="m-3 rounded-md border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/50 dark:bg-orange-950/30">
				<div className="flex gap-3">
					<AlertTriangle className="h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" />
					<div className="flex-1 space-y-2">
						<p className="text-sm text-orange-800 dark:text-orange-200">
							{error}
						</p>
						{isAccessError && onReconnect && (
							<Button
								variant="outline"
								size="sm"
								onClick={onReconnect}
								className="gap-1.5"
							>
								<RefreshCw className="h-3.5 w-3.5" />
								Reconnect GitHub
							</Button>
						)}
					</div>
				</div>
			</div>
		);
	}

	if (isRootLoading && !rootEntries) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (rootEntries && rootEntries.length === 0) {
		return (
			<div className="p-4 text-sm text-muted-foreground text-center">
				{filterMarkdown
					? "No markdown files found in this directory."
					: "Empty directory."}
			</div>
		);
	}

	return (
		<div className="py-1 overflow-auto">
			{rootEntries?.map((entry) => renderEntry(entry, 0))}
		</div>
	);
}
