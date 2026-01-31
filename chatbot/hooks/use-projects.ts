"use client";

import { useCallback, useEffect, useState } from "react";

export interface Project {
	id: string;
	userId: string;
	name: string;
	url: string;
	type: "github" | "website";
	description?: string;
	isDefault: boolean;
	settings?: {
		autoAnalyze?: boolean;
		analyzeInterval?: number;
		notifications?: boolean;
	};
	lastAnalyzedAt?: Date;
	createdAt: Date;
}

export function useProjects() {
	const [projects, setProjects] = useState<Project[]>([]);
	const [selectedProject, setSelectedProject] = useState<Project | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchProjects = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/projects");
			if (!response.ok) throw new Error("Failed to fetch projects");

			const data = await response.json();
			setProjects(data);

			// Auto-select default project
			const defaultProject = data.find((p: Project) => p.isDefault);
			if (defaultProject && !selectedProject) {
				setSelectedProject(defaultProject);
			} else if (data.length > 0 && !selectedProject) {
				setSelectedProject(data[0]);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch projects");
		} finally {
			setLoading(false);
		}
	}, [selectedProject]);

	const createProject = useCallback(
		async (data: Omit<Project, "id" | "userId" | "createdAt">) => {
			setError(null);

			try {
				const response = await fetch("/api/projects", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});

				if (!response.ok) throw new Error("Failed to create project");

				const created = await response.json();
				setProjects((prev) => {
					// If new project is default, unset others
					if (created.isDefault) {
						return [created, ...prev.map((p) => ({ ...p, isDefault: false }))];
					}
					return [created, ...prev];
				});

				return created;
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to create project";
				setError(message);
				throw err;
			}
		},
		[]
	);

	const updateProject = useCallback(
		async (id: string, data: Partial<Project>) => {
			setError(null);

			try {
				const response = await fetch(`/api/projects/${id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});

				if (!response.ok) throw new Error("Failed to update project");

				const updated = await response.json();
				setProjects((prev) =>
					prev.map((p) => {
						if (p.id === id) return updated;
						// If updated project is now default, unset others
						if (updated.isDefault && p.isDefault) return { ...p, isDefault: false };
						return p;
					})
				);

				if (selectedProject?.id === id) {
					setSelectedProject(updated);
				}

				return updated;
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to update project";
				setError(message);
				throw err;
			}
		},
		[selectedProject]
	);

	const deleteProject = useCallback(
		async (id: string) => {
			setError(null);

			try {
				const response = await fetch(`/api/projects/${id}`, {
					method: "DELETE",
				});

				if (!response.ok) throw new Error("Failed to delete project");

				setProjects((prev) => prev.filter((p) => p.id !== id));

				if (selectedProject?.id === id) {
					const remaining = projects.filter((p) => p.id !== id);
					setSelectedProject(remaining[0] || null);
				}
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to delete project";
				setError(message);
				throw err;
			}
		},
		[projects, selectedProject]
	);

	const selectProject = useCallback((project: Project | null) => {
		setSelectedProject(project);
	}, []);

	useEffect(() => {
		fetchProjects();
	}, []);

	return {
		projects,
		selectedProject,
		loading,
		error,
		refresh: fetchProjects,
		createProject,
		updateProject,
		deleteProject,
		selectProject,
		clearError: () => setError(null),
	};
}
