"use client";

import { useState } from "react";
import { useTemplates, type TemplateWithSections } from "@/hooks/use-templates";
import { TemplatesList } from "./templates-list";
import { TemplateEditorModal } from "./template-editor-modal";
import { TemplateGenerateModal } from "./template-generate-modal";

interface TemplatesTabProps {
	projectId?: string;
}

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
		generatePrompt,
		generateContent,
		importDefault,
		clearError,
		clearGenerationJob,
	} = useTemplates(projectId);

	const [editorOpen, setEditorOpen] = useState(false);
	const [editingTemplate, setEditingTemplate] =
		useState<TemplateWithSections | null>(null);
	const [generateOpen, setGenerateOpen] = useState(false);
	const [generateTemplate, setGenerateTemplate] =
		useState<TemplateWithSections | null>(null);

	const handleCreateNew = () => {
		setEditingTemplate(null);
		setEditorOpen(true);
	};

	const handleEdit = (template: TemplateWithSections) => {
		setEditingTemplate(template);
		setEditorOpen(true);
	};

	const handleGenerate = (template: TemplateWithSections) => {
		setGenerateTemplate(template);
		setGenerateOpen(true);
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

			<TemplateEditorModal
				open={editorOpen}
				onOpenChange={setEditorOpen}
				template={editingTemplate}
				onSubmit={async (data) => {
					if (editingTemplate) {
						await updateTemplate(editingTemplate.id, data);
					} else {
						await createTemplate(data);
					}
					setEditorOpen(false);
				}}
				onGeneratePrompt={generatePrompt}
			/>

			{generateTemplate && (
				<TemplateGenerateModal
					open={generateOpen}
					onOpenChange={(open) => {
						setGenerateOpen(open);
						if (!open) {
							clearGenerationJob();
						}
					}}
					template={generateTemplate}
					generating={generating}
					generationJob={generationJob}
					onGenerate={(context, userInputs) =>
						generateContent(generateTemplate, context, userInputs)
					}
				/>
			)}
		</div>
	);
}
