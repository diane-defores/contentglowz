"use client";

import { ArrowLeft, GitBranch } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useProjectsContext } from "@/contexts/projects-context";
import { useGitHub } from "@/hooks/use-github";
import { parseGitHubUrl } from "./github-browser-sheet-utils";
import { consumeGitHubReturnFlag } from "./github-connect-prompt";
import { ContentSourcesPanel } from "./content-sources-panel";
import { GitHubConnectPrompt } from "./github-connect-prompt";
import { GitHubFileEditor } from "./github-file-editor";
import { GitHubTreeBrowser } from "./github-tree-browser";
import { ProjectSelector } from "./project-selector";
import { SettingsModal } from "./settings-modal";

export function RepoBrowserPage() {
	const { selectedProject } = useProjectsContext();
	const { connected, loading, checkConnection } = useGitHub();
	const [editingFile, setEditingFile] = useState<string | null>(null);
	const [reconnecting, setReconnecting] = useState(false);
	const [selectedFolder, setSelectedFolder] = useState<string>("");

	const parsed = useMemo(
		() => (selectedProject?.url ? parseGitHubUrl(selectedProject.url) : null),
		[selectedProject?.url],
	);

	// Re-check connection on mount and after OAuth return
	useEffect(() => {
		checkConnection();
	}, [checkConnection]);

	// Handle OAuth return flag
	useEffect(() => {
		if (selectedProject?.type === "github" && consumeGitHubReturnFlag()) {
			checkConnection();
		}
	}, [selectedProject, checkConnection]);

	const handleFileSelect = useCallback((path: string) => {
		setEditingFile(path);
	}, []);

	const handleBackToTree = useCallback(() => {
		setEditingFile(null);
	}, []);

	const handleReconnect = useCallback(() => {
		setReconnecting(true);
	}, []);

	const handleFolderSelect = useCallback((path: string) => {
		setSelectedFolder(path);
	}, []);

	// No project selected
	if (!selectedProject) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
				<p className="text-muted-foreground">No project selected.</p>
				<Link
					href="/dashboard"
					className="text-sm text-primary underline hover:no-underline"
				>
					Back to Dashboard
				</Link>
			</div>
		);
	}

	// Non-GitHub project
	if (selectedProject.type !== "github" || !parsed) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
				<p className="text-muted-foreground">
					Repository browsing is only available for GitHub projects.
				</p>
				<Link
					href="/dashboard"
					className="text-sm text-primary underline hover:no-underline"
				>
					Back to Dashboard
				</Link>
			</div>
		);
	}

	const { owner, repo } = parsed;

	return (
		<div className="flex min-h-screen flex-col">
			{/* Header */}
			<header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background px-4 py-3">
				<Link
					href="/dashboard"
					className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					<span className="hidden sm:inline">Dashboard</span>
				</Link>

				<div className="flex items-center gap-2 min-w-0">
					<GitBranch className="h-4 w-4 shrink-0 text-muted-foreground" />
					<span className="truncate text-sm font-medium">
						{owner}/{repo}
					</span>
					<Badge variant="secondary" className="text-xs shrink-0">
						main
					</Badge>
				</div>

				<div className="ml-auto flex items-center gap-2">
					<ProjectSelector />
					<SettingsModal />
				</div>
			</header>

			{/* Main content */}
			<div className="flex flex-1 flex-col lg:flex-row">
				{/* Left panel */}
				<aside className="w-full border-b lg:w-[400px] lg:shrink-0 lg:border-b-0 lg:border-r lg:overflow-y-auto lg:h-[calc(100vh-57px)]">
					<div className="p-4 space-y-6">
						<ContentSourcesPanel
							projectId={selectedProject.id}
							owner={owner}
							repo={repo}
							selectedPath={selectedFolder}
						/>
					</div>
				</aside>

				{/* Right panel */}
				<main className="flex-1 min-h-0 lg:overflow-y-auto lg:h-[calc(100vh-57px)]">
					{loading ? (
						<div className="flex items-center justify-center py-20">
							<span className="text-sm text-muted-foreground">
								Checking GitHub connection...
							</span>
						</div>
					) : connected === false || reconnecting ? (
						<GitHubConnectPrompt
							onConnected={() => {
								setReconnecting(false);
								checkConnection();
							}}
							reconnect={reconnecting}
						/>
					) : editingFile ? (
						<div className="h-full">
							<GitHubFileEditor
								owner={owner}
								repo={repo}
								filePath={editingFile}
								onClose={handleBackToTree}
							/>
						</div>
					) : (
						<div className="h-full border-l-0">
							<GitHubTreeBrowser
								owner={owner}
								repo={repo}
								filterMarkdown
								onFileSelect={handleFileSelect}
								onFolderSelect={handleFolderSelect}
								onReconnect={handleReconnect}
							/>
						</div>
					)}
				</main>
			</div>
		</div>
	);
}
