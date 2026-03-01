"use client";

import {
	FolderOpen,
	LayoutTemplate,
	Loader2,
	MoreHorizontal,
	Pencil,
	Plus,
	RefreshCw,
	Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/hooks/use-confirm";
import { useContentSources } from "@/hooks/use-content-sources";
import type { ContentSource } from "@/lib/db/schema";
import { ContentSourceConfig } from "./content-source-config";

interface ContentSourcesPanelProps {
	projectId: string;
	owner: string;
	repo: string;
	/** The currently selected folder path from the main tree browser */
	selectedPath?: string;
}

export function ContentSourcesPanel({
	projectId,
	owner,
	repo,
	selectedPath = "",
}: ContentSourcesPanelProps) {
	const {
		sources,
		loading,
		createSource,
		updateSource,
		deleteSource,
		syncSource,
		syncAllSources,
	} = useContentSources(projectId);
	const { confirm, ConfirmDialog } = useConfirm();
	const [showConfig, setShowConfig] = useState(false);
	const [editingSource, setEditingSource] = useState<ContentSource | null>(
		null,
	);
	const [templateNames, setTemplateNames] = useState<Record<string, string>>(
		{},
	);

	// Fetch template names for display on source items
	useEffect(() => {
		async function loadTemplateNames() {
			try {
				const params = new URLSearchParams();
				if (projectId) params.set("projectId", projectId);
				const res = await fetch(`/api/templates?${params}`);
				if (res.ok) {
					const data: { id: string; name: string }[] = await res.json();
					const map: Record<string, string> = {};
					for (const t of data) {
						map[t.id] = t.name;
					}
					setTemplateNames(map);
				}
			} catch {
				// Silently fail
			}
		}
		loadTemplateNames();
	}, [projectId]);

	const handleSave = useCallback(
		async (data: {
			name: string;
			basePath: string;
			filePattern: "md" | "mdx" | "both" | "astro" | "ts" | "all";
			templateId: string | null;
			defaultBranch: string;
		}) => {
			const metadataProfile = {
				metadataProfile: "frontmatter-v1" as const,
				metadataValidation: "strict" as const,
				platform: "astro-next" as const,
			};

			try {
				if (editingSource) {
					await updateSource(editingSource.id, {
						...data,
						metadata: editingSource.metadata ?? metadataProfile,
					});
					toast({
						type: "success",
						description: `Updated "${data.name}"`,
					});
				} else {
					await createSource({
						projectId,
						name: data.name,
						repoOwner: owner,
						repoName: repo,
						basePath: data.basePath,
						filePattern: data.filePattern,
						templateId: data.templateId,
						defaultBranch: data.defaultBranch,
						metadata: metadataProfile,
					});
					toast({
						type: "success",
						description: `Created "${data.name}"`,
					});
				}
				setShowConfig(false);
				setEditingSource(null);
			} catch (err) {
				toast({
					type: "error",
					description:
						err instanceof Error
							? err.message
							: "Failed to save content source",
				});
			}
		},
		[editingSource, projectId, owner, repo, createSource, updateSource],
	);

	const handleDelete = useCallback(
		async (source: ContentSource) => {
			const ok = await confirm({
				title: "Delete content source",
				description: `Delete content source "${source.name}"?`,
				confirmLabel: "Delete",
				destructive: true,
			});
			if (!ok) return;
			try {
				await deleteSource(source.id);
				toast({
					type: "success",
					description: `Deleted "${source.name}"`,
				});
			} catch (err) {
				toast({
					type: "error",
					description:
						err instanceof Error
							? err.message
							: "Failed to delete content source",
				});
			}
		},
		[deleteSource, confirm],
	);

	const handleSyncSource = useCallback(
		async (source: ContentSource) => {
			try {
				const result = await syncSource(source.id);
				toast({
					type: "success",
					description: `Synced ${result.recordsUpserted ?? 0} records from "${source.name}"`,
				});
			} catch (err) {
				toast({
					type: "error",
					description:
						err instanceof Error
							? err.message
							: "Failed to sync source metadata",
				});
			}
		},
		[syncSource],
	);

	const handleSyncAllSources = useCallback(async () => {
		try {
			const result = await syncAllSources();
			toast({
				type: "success",
				description: `Synced ${result.recordsUpserted ?? 0} records from ${result.sourcesProcessed ?? 0} source(s)`,
			});
		} catch (err) {
			toast({
				type: "error",
				description:
					err instanceof Error ? err.message : "Failed to sync all sources",
			});
		}
	}, [syncAllSources]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-4">
				<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h4 className="text-sm font-medium">Content Sources</h4>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={handleSyncAllSources}>
						<RefreshCw className="mr-1 h-3 w-3" />
						Sync All
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setEditingSource(null);
							setShowConfig(true);
						}}
					>
						<Plus className="mr-1 h-3 w-3" />
						Add Source
					</Button>
				</div>
			</div>

			{sources.length === 0 ? (
				<div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
					<FolderOpen className="mx-auto mb-2 h-5 w-5" />
					No content sources yet. Map a directory to get started.
				</div>
			) : (
				<div className="space-y-2">
					{sources.map((source) => (
						<div
							key={source.id}
							className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-accent/50 transition-colors"
						>
							<div className="min-w-0">
								<div className="text-sm font-medium truncate">
									{source.name}
								</div>
								<div className="text-xs text-muted-foreground truncate">
									{source.basePath}
								</div>
								{source.templateId && templateNames[source.templateId] && (
									<span className="inline-flex items-center gap-1 mt-1 rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary">
										<LayoutTemplate className="h-3 w-3" />
										{templateNames[source.templateId]}
									</span>
								)}
							</div>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="h-7 w-7 p-0"
										onClick={(e) => e.stopPropagation()}
									>
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										onClick={() => {
											setEditingSource(source);
											setShowConfig(true);
										}}
									>
										<Pencil className="mr-2 h-3 w-3" />
										Edit
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => handleSyncSource(source)}>
										<RefreshCw className="mr-2 h-3 w-3" />
										Sync Metadata
									</DropdownMenuItem>
									<DropdownMenuItem
										className="text-destructive"
										onClick={() => handleDelete(source)}
									>
										<Trash2 className="mr-2 h-3 w-3" />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					))}
				</div>
			)}

			{/* Config dialog */}
			<Dialog
				open={showConfig}
				onOpenChange={(open) => {
					setShowConfig(open);
					if (!open) setEditingSource(null);
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{editingSource ? "Edit Content Source" : "Add Content Source"}
						</DialogTitle>
						<DialogDescription>
							Map a repository directory as a content source.
						</DialogDescription>
					</DialogHeader>
					<ContentSourceConfig
						projectId={projectId}
						owner={owner}
						repo={repo}
						source={editingSource}
						selectedPath={selectedPath}
						onSave={handleSave}
						onCancel={() => {
							setShowConfig(false);
							setEditingSource(null);
						}}
					/>
				</DialogContent>
			</Dialog>

			<ConfirmDialog />
		</div>
	);
}
