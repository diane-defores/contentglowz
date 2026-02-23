"use client";

import { useMemo, useState } from "react";
import { useContentSources } from "@/hooks/use-content-sources";
import { useTemplates, type TemplateWithSections } from "@/hooks/use-templates";
import type { ContentSourceInfo } from "./template-editor-modal";
import { TemplateEditor } from "./template-editor-modal";
import { TemplateGenerate } from "./template-generate-modal";
import { TemplatesList } from "./templates-list";

interface TemplatesTabProps {
	projectId?: string;
}

type View = "list" | "edit" | "generate";

export function TemplatesTab({ projectId }: TemplatesTabProps) {
	const {
		templates,
		defaultTemplates,
		loading,
		error,
		generating,
		generationJob,
		createTemplate,
		updateTemplate,
		deleteTemplate,
		cloneTemplate,
		generateSections,
		generateAllPrompts,
		generatePrompt,
		generateContent,
		importDefault,
		clearError,
		clearGenerationJob,
	} = useTemplates(projectId);

	const { sources: contentSources } = useContentSources(projectId);

	const contentSourceInfo = useMemo((): ContentSourceInfo | undefined => {
		const source = contentSources.find(
			(s) => s.repoOwner && s.repoName,
		);
		if (!source) return undefined;
		return {
			repoOwner: source.repoOwner,
			repoName: source.repoName,
			basePath: source.basePath || "",
			filePattern: source.filePattern || "both",
		};
	}, [contentSources]);

	const [view, setView] = useState<View>("list");
	const [activeTemplate, setActiveTemplate] =
		useState<TemplateWithSections | null>(null);

	const handleCreateNew = () => {
		setActiveTemplate(null);
		setView("edit");
	};

	const handleEdit = (template: TemplateWithSections) => {
		setActiveTemplate(template);
		setView("edit");
	};

	const handleGenerate = (template: TemplateWithSections) => {
		setActiveTemplate(template);
		setView("generate");
	};

	const handleBack = () => {
		setView("list");
		setActiveTemplate(null);
		clearGenerationJob();
	};

	const handleDelete = async (id: string) => {
		await deleteTemplate(id);
	};

	const handleClone = async (id: string) => {
		await cloneTemplate(id);
	};

	return (
		<div className="space-y-6">
			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
					{error}
					<button
						type="button"
						onClick={clearError}
						className="ml-2 underline"
					>
						Dismiss
					</button>
				</div>
			)}

			{view === "edit" && (
				<TemplateEditor
					template={activeTemplate}
					onBack={handleBack}
					onSubmit={async (data) => {
						if (activeTemplate) {
							await updateTemplate(activeTemplate.id, data);
						} else {
							await createTemplate(data);
						}
						handleBack();
					}}
					onGeneratePrompt={generatePrompt}
					onGenerateSections={generateSections}
					onGenerateAllPrompts={generateAllPrompts}
					contentSourceInfo={contentSourceInfo}
				/>
			)}

			{view === "generate" && activeTemplate && (
				<TemplateGenerate
					template={activeTemplate}
					generating={generating}
					generationJob={generationJob}
					onGenerate={(context, userInputs, promptOverrides) =>
						generateContent(activeTemplate, context, userInputs, promptOverrides)
					}
					onBack={handleBack}
				/>
			)}

			{view === "list" && (
				<TemplatesList
					templates={templates}
					defaultTemplates={defaultTemplates}
					loading={loading}
					onCreateNew={handleCreateNew}
					onEdit={handleEdit}
					onDelete={handleDelete}
					onClone={handleClone}
					onGenerate={handleGenerate}
					onImportDefault={importDefault}
				/>
			)}
		</div>
	);
}
