"use client";

import {
	Copy,
	Download,
	FileText,
	Mail,
	Pencil,
	Plus,
	Sparkles,
	Trash2,
	Video,
	Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type {
	TemplateWithSections,
	DefaultTemplate,
} from "@/hooks/use-templates";

interface TemplatesListProps {
	templates: TemplateWithSections[];
	defaultTemplates: DefaultTemplate[];
	loading: boolean;
	onCreateNew: () => void;
	onEdit: (template: TemplateWithSections) => void;
	onDelete: (id: string) => void;
	onClone: (id: string) => void;
	onGenerate: (template: TemplateWithSections) => void;
	onImportDefault: (tmpl: DefaultTemplate) => Promise<any>;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
	article: <FileText className="h-4 w-4" />,
	newsletter: <Mail className="h-4 w-4" />,
	video_script: <Video className="h-4 w-4" />,
	seo_brief: <Zap className="h-4 w-4" />,
};

const TYPE_LABELS: Record<string, string> = {
	article: "Article",
	newsletter: "Newsletter",
	video_script: "Video Script",
	seo_brief: "SEO Brief",
};

const TYPE_COLORS: Record<string, string> = {
	article: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	newsletter:
		"bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
	video_script:
		"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
	seo_brief:
		"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export function TemplatesList({
	templates,
	defaultTemplates,
	loading,
	onCreateNew,
	onEdit,
	onDelete,
	onClone,
	onGenerate,
	onImportDefault,
}: TemplatesListProps) {
	if (loading) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-9 w-40" />
				</div>
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-24 w-full" />
				))}
			</div>
		);
	}

	// Find which defaults haven't been imported yet
	const importedSlugs = new Set(templates.map((t) => t.slug));
	const availableDefaults = defaultTemplates.filter(
		(d) => !importedSlugs.has(d.slug),
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<h3 className="font-semibold">Templates</h3>
					{templates.length > 0 && (
						<Badge variant="secondary">{templates.length}</Badge>
					)}
				</div>
				<Button size="sm" onClick={onCreateNew}>
					<Plus className="mr-1.5 h-3.5 w-3.5" />
					New Template
				</Button>
			</div>

			{/* Available defaults to import */}
			{availableDefaults.length > 0 && (
				<div className="space-y-2">
					<p className="text-xs font-medium text-muted-foreground">
						Quick Start — Import a default template
					</p>
					<div className="grid gap-2 sm:grid-cols-2">
						{availableDefaults.map((d) => (
							<Card
								key={d.slug}
								className="flex items-center justify-between p-3"
							>
								<div className="flex items-center gap-2 min-w-0">
									{TYPE_ICONS[d.content_type] || (
										<FileText className="h-4 w-4" />
									)}
									<div className="min-w-0">
										<p className="text-sm font-medium truncate">
											{d.name}
										</p>
										<p className="text-xs text-muted-foreground">
											{d.sections.length} sections
										</p>
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onImportDefault(d)}
								>
									<Download className="mr-1 h-3.5 w-3.5" />
									Import
								</Button>
							</Card>
						))}
					</div>
				</div>
			)}

			{/* Empty state */}
			{templates.length === 0 && availableDefaults.length === 0 && (
				<Card className="p-8 text-center">
					<Sparkles className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
					<p className="text-sm text-muted-foreground">
						No templates yet. Create one or import a default to get
						started.
					</p>
				</Card>
			)}

			{/* Template cards */}
			{templates.length > 0 && (
				<div className="space-y-3">
					{templates.map((tmpl) => (
						<Card key={tmpl.id} className="p-4">
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0 flex-1 space-y-2">
									<div className="flex items-center gap-2 flex-wrap">
										{TYPE_ICONS[tmpl.contentType] || (
											<FileText className="h-4 w-4" />
										)}
										<span className="text-sm font-medium">
											{tmpl.name}
										</span>
										<Badge
											variant="outline"
											className={
												TYPE_COLORS[
													tmpl.contentType
												] || ""
											}
										>
											{TYPE_LABELS[tmpl.contentType] ||
												tmpl.contentType}
										</Badge>
										{tmpl.isSystem && (
											<Badge variant="secondary">
												System
											</Badge>
										)}
										<Badge
											variant="secondary"
											className="text-xs"
										>
											{tmpl.sections?.length || 0}{" "}
											sections
										</Badge>
									</div>
									{tmpl.description && (
										<p className="text-xs text-muted-foreground line-clamp-2">
											{tmpl.description}
										</p>
									)}
								</div>

								<div className="flex items-center gap-1 shrink-0">
									<Button
										variant="default"
										size="sm"
										onClick={() => onGenerate(tmpl)}
									>
										<Zap className="mr-1 h-3.5 w-3.5" />
										Generate
									</Button>
									{!tmpl.isSystem && (
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8"
											onClick={() => onEdit(tmpl)}
										>
											<Pencil className="h-3.5 w-3.5" />
										</Button>
									)}
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										onClick={() => onClone(tmpl.id)}
									>
										<Copy className="h-3.5 w-3.5" />
									</Button>
									{!tmpl.isSystem && (
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-destructive hover:text-destructive"
											onClick={() => onDelete(tmpl.id)}
										>
											<Trash2 className="h-3.5 w-3.5" />
										</Button>
									)}
								</div>
							</div>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
