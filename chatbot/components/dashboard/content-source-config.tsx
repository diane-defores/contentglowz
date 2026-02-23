"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ContentSource } from "@/lib/db/schema";

interface ContentTemplate {
	id: string;
	name: string;
	contentType: string;
}

interface ContentSourceConfigProps {
	projectId: string;
	owner: string;
	repo: string;
	source?: ContentSource | null;
	/** Pre-filled base path from the main tree browser's selected folder */
	selectedPath?: string;
	onSave: (data: {
		name: string;
		basePath: string;
		filePattern: "md" | "mdx" | "both" | "astro" | "ts" | "all";
		templateId: string | null;
		defaultBranch: string;
	}) => void;
	onCancel: () => void;
}

export function ContentSourceConfig({
	projectId,
	source,
	selectedPath = "",
	onSave,
	onCancel,
}: ContentSourceConfigProps) {
	const [name, setName] = useState(source?.name || "");
	const [basePath, setBasePath] = useState(
		source?.basePath || selectedPath || "",
	);
	const [filePattern, setFilePattern] = useState(
		source?.filePattern || "all",
	);
	const [templateId, setTemplateId] = useState<string | null>(
		source?.templateId || null,
	);
	const [defaultBranch, setDefaultBranch] = useState(
		source?.defaultBranch || "main",
	);
	const [templates, setTemplates] = useState<ContentTemplate[]>([]);
	const [loadingTemplates, setLoadingTemplates] = useState(false);

	// When selectedPath changes and we're not editing an existing source, update basePath
	useEffect(() => {
		if (!source && selectedPath) {
			setBasePath(selectedPath);
		}
	}, [selectedPath, source]);

	useEffect(() => {
		async function loadTemplates() {
			setLoadingTemplates(true);
			try {
				const params = new URLSearchParams();
				if (projectId) params.set("projectId", projectId);
				const res = await fetch(`/api/templates?${params}`);
				if (res.ok) {
					const data = await res.json();
					setTemplates(data);
				}
			} catch {
				// Silently fail — templates are optional
			} finally {
				setLoadingTemplates(false);
			}
		}
		loadTemplates();
	}, [projectId]);

	const handleSubmit = useCallback(() => {
		if (!name || !basePath) return;
		onSave({
			name,
			basePath,
			filePattern,
			templateId,
			defaultBranch,
		});
	}, [name, basePath, filePattern, templateId, defaultBranch, onSave]);

	return (
		<>
			<div className="grid gap-4">
				<div className="grid gap-2">
					<Label htmlFor="source-name">Name</Label>
					<Input
						id="source-name"
						placeholder="Blog Posts"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="source-path">Base Path</Label>
					<Input
						id="source-path"
						placeholder="Select a folder in the tree above"
						value={basePath || "(repo root)"}
						readOnly
						className="text-muted-foreground"
					/>
					{!basePath && !source && (
						<p className="text-xs text-muted-foreground">
							Click a folder in the tree browser to set the path.
						</p>
					)}
				</div>

				<div className="grid gap-2">
					<Label>File Pattern</Label>
					<Select
						value={filePattern}
						onValueChange={(v) =>
							setFilePattern(v as "md" | "mdx" | "both")
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All (.md, .mdx, .astro, .ts)</SelectItem>
							<SelectItem value="md">Markdown (.md)</SelectItem>
							<SelectItem value="mdx">MDX (.mdx)</SelectItem>
							<SelectItem value="both">Markdown & MDX</SelectItem>
							<SelectItem value="astro">Astro (.astro)</SelectItem>
							<SelectItem value="ts">TypeScript (.ts)</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="grid gap-2">
					<Label>Template (optional)</Label>
					{loadingTemplates ? (
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<Loader2 className="h-3 w-3 animate-spin" />
							Loading templates...
						</div>
					) : (
						<div className="flex items-center gap-2 flex-wrap">
							<button
								type="button"
								onClick={() => setTemplateId(null)}
								className={cn(
									"rounded-md border px-2 py-1 text-xs transition-colors hover:bg-accent",
									templateId === null && "border-primary bg-primary/10",
								)}
							>
								None
							</button>
							{templates.map((t) => (
								<button
									key={t.id}
									type="button"
									onClick={() => setTemplateId(t.id)}
									className={cn(
										"rounded-md border px-2 py-1 text-xs transition-colors hover:bg-accent",
										templateId === t.id && "border-primary bg-primary/10",
									)}
								>
									{t.name}
								</button>
							))}
							<Link
								href="/dashboard/templates"
								className="text-xs text-primary hover:underline"
							>
								+ New template
							</Link>
						</div>
					)}
				</div>

				<div className="grid gap-2">
					<Label htmlFor="source-branch">Default Branch</Label>
					<Input
						id="source-branch"
						value={defaultBranch}
						onChange={(e) => setDefaultBranch(e.target.value)}
						placeholder="main"
					/>
				</div>
			</div>

			<div className="flex justify-end gap-2 pt-4">
				<Button variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={!name || !basePath}
				>
					{source ? "Update Source" : "Add Source"}
				</Button>
			</div>
		</>
	);
}
