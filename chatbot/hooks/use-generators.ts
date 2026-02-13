"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NewsletterGenerator } from "@/lib/db/schema";
import type {
	NewsletterFormData,
	NewsletterJobStatus,
	NewsletterResult,
} from "./use-newsletter";

export type GeneratorFormData = {
	name: string;
	topics: string[];
	targetAudience: string;
	tone: "professional" | "casual" | "friendly" | "educational";
	competitorEmails: string[];
	includeEmailInsights: boolean;
	maxSections: number;
	schedule: "manual" | "daily" | "weekly" | "monthly";
	scheduleDay?: number;
	scheduleTime?: string;
	status: "active" | "paused";
	projectId?: string;
};

const POLL_INTERVAL = 2000;

export function useGenerators(projectId?: string) {
	const [generators, setGenerators] = useState<NewsletterGenerator[]>([]);
	const [loading, setLoading] = useState(true);
	const [generatingId, setGeneratingId] = useState<string | null>(null);
	const [jobStatus, setJobStatus] = useState<NewsletterJobStatus | null>(null);
	const [generationResult, setGenerationResult] =
		useState<NewsletterResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const stopPolling = useCallback(() => {
		if (pollRef.current) {
			clearInterval(pollRef.current);
			pollRef.current = null;
		}
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			stopPolling();
		};
	}, [stopPolling]);

	const fetchGenerators = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const url = projectId
				? `/api/generators?projectId=${projectId}`
				: "/api/generators";
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error("Failed to fetch generators");
			}
			const data = await response.json();
			setGenerators(data);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to fetch generators";
			setError(message);
		} finally {
			setLoading(false);
		}
	}, [projectId]);

	const createGenerator = useCallback(
		async (data: GeneratorFormData): Promise<NewsletterGenerator | null> => {
			setError(null);

			try {
				const response = await fetch("/api/generators", {
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
						errData.error ||
							`Failed to create generator (${response.status})`,
					);
				}

				const created = await response.json();
				setGenerators((prev) => [created, ...prev]);
				return created;
			} catch (err) {
				const message =
					err instanceof Error
						? err.message
						: "Failed to create generator";
				setError(message);
				return null;
			}
		},
		[projectId],
	);

	const updateGenerator = useCallback(
		async (
			id: string,
			data: Partial<GeneratorFormData>,
		): Promise<NewsletterGenerator | null> => {
			setError(null);

			try {
				const response = await fetch(`/api/generators/${id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});

				if (!response.ok) {
					const errData = await response.json().catch(() => ({}));
					throw new Error(
						errData.error ||
							`Failed to update generator (${response.status})`,
					);
				}

				const updated = await response.json();
				setGenerators((prev) =>
					prev.map((g) => (g.id === id ? updated : g)),
				);
				return updated;
			} catch (err) {
				const message =
					err instanceof Error
						? err.message
						: "Failed to update generator";
				setError(message);
				return null;
			}
		},
		[],
	);

	const deleteGenerator = useCallback(
		async (id: string): Promise<boolean> => {
			setError(null);

			try {
				const response = await fetch(`/api/generators/${id}`, {
					method: "DELETE",
				});

				if (!response.ok) {
					throw new Error("Failed to delete generator");
				}

				setGenerators((prev) => prev.filter((g) => g.id !== id));
				return true;
			} catch (err) {
				const message =
					err instanceof Error
						? err.message
						: "Failed to delete generator";
				setError(message);
				return false;
			}
		},
		[],
	);

	const pollJobStatusFn = useCallback(
		(jobId: string, generatorId: string) => {
			stopPolling();

			pollRef.current = setInterval(async () => {
				try {
					const res = await fetch(
						`/api/seo/api/newsletter/status/${jobId}`,
					);
					if (!res.ok) {
						throw new Error("Failed to check job status");
					}
					const status: NewsletterJobStatus = await res.json();
					setJobStatus(status);

					if (status.status === "completed" && status.result) {
						stopPolling();
						setGenerationResult(status.result);
						setGeneratingId(null);
						// Update generator's last run status
						await fetch(`/api/generators/${generatorId}`, {
							method: "PUT",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								lastRunAt: new Date().toISOString(),
								lastRunStatus: "completed",
							}),
						});
						setGenerators((prev) =>
							prev.map((g) =>
								g.id === generatorId
									? {
											...g,
											lastRunAt: new Date(),
											lastRunStatus: "completed" as const,
										}
									: g,
							),
						);

						// Create ContentRecord + ContentBody in backend for tracking
						try {
							const result = status.result;
							const subjectLine = result.subject_line || "Newsletter";
							const bodyContent = result.content || "";
							const preview = bodyContent.replace(/<[^>]*>/g, "").slice(0, 500);

							// Create content record via status API
							const crRes = await fetch("/api/seo/api/status/content", {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({
									title: subjectLine,
									content_type: "newsletter",
									source_robot: "newsletter",
									status: "generated",
									project_id: projectId || null,
									content_preview: preview,
									metadata: {
										generator_id: generatorId,
										job_id: jobId,
										word_count: result.word_count || 0,
									},
								}),
							});
							if (crRes.ok) {
								const contentRecord = await crRes.json();
								// Save the full body
								await fetch(`/api/seo/api/status/content/${contentRecord.id}/body`, {
									method: "PUT",
									headers: { "Content-Type": "application/json" },
									body: JSON.stringify({
										body: bodyContent,
										edited_by: "newsletter-robot",
										edit_note: "Initial generation",
									}),
								});
								// Transition to pending_review
								await fetch(`/api/seo/api/status/content/${contentRecord.id}/transition`, {
									method: "POST",
									headers: { "Content-Type": "application/json" },
									body: JSON.stringify({
										to_status: "pending_review",
										changed_by: "newsletter-robot",
									}),
								});
							}
						} catch {
							// Non-critical: content record creation failed silently
							console.warn("Failed to create ContentRecord for newsletter");
						}
					} else if (status.status === "failed") {
						stopPolling();
						setGeneratingId(null);
						setError(
							status.message || "Newsletter generation failed",
						);
						// Update generator's last run status
						await fetch(`/api/generators/${generatorId}`, {
							method: "PUT",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								lastRunAt: new Date().toISOString(),
								lastRunStatus: "failed",
							}),
						});
						setGenerators((prev) =>
							prev.map((g) =>
								g.id === generatorId
									? {
											...g,
											lastRunAt: new Date(),
											lastRunStatus: "failed" as const,
										}
									: g,
							),
						);
					}
				} catch (err) {
					stopPolling();
					setGeneratingId(null);
					setError(
						err instanceof Error
							? err.message
							: "Failed to check job status",
					);
				}
			}, POLL_INTERVAL);
		},
		[stopPolling],
	);

	const generateNow = useCallback(
		async (generator: NewsletterGenerator) => {
			setError(null);
			setGenerationResult(null);
			setJobStatus(null);
			setGeneratingId(generator.id);

			// Convert generator config to the API's expected format
			const formData: NewsletterFormData = {
				name: generator.name,
				topics: generator.topics || [],
				target_audience: generator.targetAudience,
				tone: generator.tone,
				competitor_emails: generator.competitorEmails || [],
				include_email_insights: generator.includeEmailInsights,
				max_sections: generator.maxSections,
			};

			try {
				const res = await fetch(
					"/api/seo/api/newsletter/generate/async",
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(formData),
					},
				);

				if (!res.ok) {
					const data = await res.json().catch(() => ({}));
					throw new Error(
						data.error || `Generation failed (${res.status})`,
					);
				}

				const status: NewsletterJobStatus = await res.json();
				setJobStatus(status);
				pollJobStatusFn(status.job_id, generator.id);
			} catch (err) {
				setGeneratingId(null);
				setError(
					err instanceof Error
						? err.message
						: "Failed to start newsletter generation",
				);
			}
		},
		[pollJobStatusFn],
	);

	useEffect(() => {
		fetchGenerators();
	}, [fetchGenerators, projectId]);

	return {
		generators,
		loading,
		generatingId,
		jobStatus,
		generationResult,
		error,
		refresh: fetchGenerators,
		createGenerator,
		updateGenerator,
		deleteGenerator,
		generateNow,
		clearGenerationResult: () => {
			setGenerationResult(null);
			setJobStatus(null);
		},
		clearError: () => setError(null),
	};
}
