"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useProjects as useProjectsHook, type Project } from "@/hooks/use-projects";

interface ProjectsContextValue {
	projects: Project[];
	selectedProject: Project | null;
	loading: boolean;
	error: string | null;
	refresh: () => Promise<void>;
	createProject: (data: Omit<Project, "id" | "userId" | "createdAt">) => Promise<Project>;
	updateProject: (id: string, data: Partial<Project>) => Promise<Project>;
	deleteProject: (id: string) => Promise<void>;
	selectProject: (project: Project | null) => Promise<void>;
	clearError: () => void;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function ProjectsProvider({ children }: { children: ReactNode }) {
	const projectsState = useProjectsHook();
	return (
		<ProjectsContext.Provider value={projectsState}>
			{children}
		</ProjectsContext.Provider>
	);
}

export function useProjectsContext() {
	const context = useContext(ProjectsContext);
	if (!context) {
		throw new Error("useProjectsContext must be used within a ProjectsProvider");
	}
	return context;
}
