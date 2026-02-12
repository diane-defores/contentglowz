"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ContentTemplate, TemplateSection } from "@/lib/db/schema";

export type TemplateWithSections = ContentTemplate & {
	sections: TemplateSection[];
};

export type TemplateSectionFormData = {
	id?: string;
	name: string;
	label: string;
	fieldType: TemplateSection["fieldType"];
	required?: boolean;
	order: number;
	description?: string;
	placeholder?: string;
	defaultPrompt?: string;
	userPrompt?: string;
	promptStrategy?: TemplateSection["promptStrategy"];
	generationHints?: TemplateSection["generationHints"];
};

export type TemplateFormData = {
	name: string;
	slug: string;
	contentType: ContentTemplate["contentType"];
	description?: string;
	projectId?: string;
	isSystem?: boolean;
	sections: TemplateSectionFormData[];
};

export type DefaultTemplate = {
	name: string;
	slug: string;
	content_type: string;
	description: string;
	sections: Array<{
		name: string;
		label: string;
		field_type: string;
		required: boolean;
		order: number;
		description?: string;
		placeholder?: string;
		default_prompt?: string;
		prompt_strategy: string;
	}>;
};

export type GenerationJob = {
	job_id: string;
	status: "pending" | "running" | "completed" | "failed";
	progress: number;
	message: string;
	result?: {
		sections: Record<string, any>;
		metadata: Record<string, any>;
		content_record_id?: string;
	};
};

const POLL_INTERVAL = 2000;

export function useTemplates(projectId?: string) {
	const [templates, setTemplates] = useState<TemplateWithSections[]>([]);
	const [defaultTemplates, setDefaultTemplates] = useState<DefaultTemplate[]>(
		[],
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [generating, setGenerating] = useState(false);
	const [generationJob, setGenerationJob] = useState<GenerationJob | null>(
		null,
	);

	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const stopPolling = useCallback(() => {
		if (pollRef.current) {
			clearInterval(pollRef.current);
			pollRef.current = null;
		}
	}, []);

	useEffect(() => {
		return () => {
			stopPolling();
		};
	}, [stopPolling]);

	// Fetch user templates
	const fetchTemplates = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const url = projectId
				? `/api/templates?projectId=${projectId}`
				: "/api/templates";
			const response = await fetch(url);
			if (!response.ok) throw new Error("Failed to fetch templates");
			const data = await response.json();
			setTemplates(data);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to fetch templates",
			);
		} finally {
			setLoading(false);
		}
	}, [projectId]);

	// Fetch default system templates from Python backend
	const fetchDefaults = useCallback(async () => {
		try {
			const res = await fetch("/api/seo/api/templates/defaults");
			if (!res.ok) return;
			const data = await res.json();
			setDefaultTemplates(data);
		} catch {
			// Non-critical
		}
	}, []);

	// Create template
	const createTemplate = useCallback(
		async (
			data: TemplateFormData,
		): Promise<TemplateWithSections | null> => {
			setError(null);
			try {
				const response = await fetch("/api/templates", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						...data,
						projectId: data.projectId || projectId,
					}),
				});
				if (!response.ok) {
					const errData = await response.json().catch(() => ({}));
					throw new Error(
						errData.error || `Failed to create template (${response.status})`,
					);
				}
				const created = await response.json();
				setTemplates((prev) => [created, ...prev]);
				return created;
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Failed to create template",
				);
				return null;
			}
		},
		[projectId],
	);

	// Update template
	const updateTemplate = useCallback(
		async (
			id: string,
			data: Partial<TemplateFormData>,
		): Promise<TemplateWithSections | null> => {
			setError(null);
			try {
				const response = await fetch(`/api/templates/${id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});
				if (!response.ok) {
					const errData = await response.json().catch(() => ({}));
					throw new Error(
						errData.error || `Failed to update template (${response.status})`,
					);
				}
				const updated = await response.json();
				setTemplates((prev) =>
					prev.map((t) => (t.id === id ? updated : t)),
				);
				return updated;
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Failed to update template",
				);
				return null;
			}
		},
		[],
	);

	// Delete template
	const deleteTemplate = useCallback(async (id: string): Promise<boolean> => {
		setError(null);
		try {
			const response = await fetch(`/api/templates/${id}`, {
				method: "DELETE",
			});
			if (!response.ok) throw new Error("Failed to delete template");
			setTemplates((prev) => prev.filter((t) => t.id !== id));
			return true;
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to delete template",
			);
			return false;
		}
	}, []);

	// Clone template
	const cloneTemplate = useCallback(
		async (id: string): Promise<TemplateWithSections | null> => {
			setError(null);
			try {
				const response = await fetch(`/api/templates/${id}/clone`, {
					method: "POST",
				});
				if (!response.ok) {
					const errData = await response.json().catch(() => ({}));
					throw new Error(
						errData.error || "Failed to clone template",
					);
				}
				const cloned = await response.json();
				setTemplates((prev) => [cloned, ...prev]);
				return cloned;
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Failed to clone template",
				);
				return null;
			}
		},
		[],
	);

	// Generate AI prompt for a section
	const generatePrompt = useCallback(
		async (sectionContext: {
			templateName: string;
			contentType: string;
			sectionName: string;
			sectionLabel: string;
			sectionFieldType: string;
			sectionDescription?: string;
			otherSections: Array<{ name: string; label: string; fieldType: string }>;
		}): Promise<{ prompt: string; reasoning: string } | null> => {
			try {
				const res = await fetch(
					"/api/seo/api/templates/generate-prompt",
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							template_name: sectionContext.templateName,
							content_type: sectionContext.contentType,
							section_name: sectionContext.sectionName,
							section_label: sectionContext.sectionLabel,
							section_field_type: sectionContext.sectionFieldType,
							section_description:
								sectionContext.sectionDescription,
							other_sections: sectionContext.otherSections,
						}),
					},
				);
				if (!res.ok) throw new Error("Prompt generation failed");
				return await res.json();
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Prompt generation failed",
				);
				return null;
			}
		},
		[],
	);

	// Generate content using template
	const generateContent = useCallback(
		async (
			template: TemplateWithSections,
			context: Record<string, any>,
			userInputs: Record<string, any> = {},
		) => {
			setError(null);
			setGenerating(true);
			setGenerationJob(null);

			try {
				const res = await fetch(
					"/api/seo/api/templates/generate-content",
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							template: {
								name: template.name,
								slug: template.slug,
								contentType: template.contentType,
								sections: template.sections.map((s) => ({
									name: s.name,
									label: s.label,
									fieldType: s.fieldType,
									required: s.required,
									order: s.order,
									defaultPrompt: s.defaultPrompt,
									userPrompt: s.userPrompt,
									promptStrategy: s.promptStrategy,
									generationHints: s.generationHints,
								})),
							},
							project_id: projectId,
							user_inputs: userInputs,
							context,
						}),
					},
				);

				if (!res.ok) {
					const data = await res.json().catch(() => ({}));
					throw new Error(
						data.error || `Generation failed (${res.status})`,
					);
				}

				const job: GenerationJob = await res.json();
				setGenerationJob(job);

				// Start polling
				pollRef.current = setInterval(async () => {
					try {
						const statusRes = await fetch(
							`/api/seo/api/templates/generate-content/${job.job_id}`,
						);
						if (!statusRes.ok) throw new Error("Status check failed");
						const status: GenerationJob = await statusRes.json();
						setGenerationJob(status);

						if (
							status.status === "completed" ||
							status.status === "failed"
						) {
							stopPolling();
							setGenerating(false);
							if (status.status === "failed") {
								setError(
									status.message || "Content generation failed",
								);
							}
						}
					} catch (err) {
						stopPolling();
						setGenerating(false);
						setError(
							err instanceof Error
								? err.message
								: "Status check failed",
						);
					}
				}, POLL_INTERVAL);
			} catch (err) {
				setGenerating(false);
				setError(
					err instanceof Error
						? err.message
						: "Failed to start content generation",
				);
			}
		},
		[projectId, stopPolling],
	);

	// Import a default template (create it as user's own)
	const importDefault = useCallback(
		async (
			defaultTmpl: DefaultTemplate,
		): Promise<TemplateWithSections | null> => {
			return await createTemplate({
				name: defaultTmpl.name,
				slug: defaultTmpl.slug,
				contentType: defaultTmpl.content_type as ContentTemplate["contentType"],
				description: defaultTmpl.description,
				sections: defaultTmpl.sections.map((s) => ({
					name: s.name,
					label: s.label,
					fieldType: s.field_type as TemplateSection["fieldType"],
					required: s.required,
					order: s.order,
					description: s.description,
					placeholder: s.placeholder,
					defaultPrompt: s.default_prompt,
					promptStrategy: s.prompt_strategy as TemplateSection["promptStrategy"],
				})),
			});
		},
		[createTemplate],
	);

	useEffect(() => {
		fetchTemplates();
		fetchDefaults();
	}, [fetchTemplates, fetchDefaults]);

	return {
		templates,
		defaultTemplates,
		loading,
		error,
		generating,
		generationJob,
		refresh: fetchTemplates,
		createTemplate,
		updateTemplate,
		deleteTemplate,
		cloneTemplate,
		generatePrompt,
		generateContent,
		importDefault,
		clearError: () => setError(null),
		clearGenerationJob: () => {
			setGenerationJob(null);
			setGenerating(false);
		},
	};
}
