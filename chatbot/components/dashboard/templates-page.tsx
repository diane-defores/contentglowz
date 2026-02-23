"use client";

import { ArrowLeft, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { useProjectsContext } from "@/contexts/projects-context";
import { ProjectSelector } from "./project-selector";
import { SettingsModal } from "./settings-modal";
import { TemplatesTab } from "./templates-tab";

export function TemplatesPage() {
	const { selectedProject } = useProjectsContext();

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

	return (
		<div className="flex min-h-screen flex-col">
			<header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background px-4 py-3">
				<Link
					href="/dashboard"
					className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					<span className="hidden sm:inline">Dashboard</span>
				</Link>

				<div className="flex items-center gap-2 min-w-0">
					<LayoutTemplate className="h-4 w-4 shrink-0 text-muted-foreground" />
					<span className="truncate text-sm font-medium">
						Templates
					</span>
				</div>

				<div className="ml-auto flex items-center gap-2">
					<ProjectSelector />
					<SettingsModal />
				</div>
			</header>

			<main className="flex-1 p-4 max-w-4xl mx-auto w-full">
				<TemplatesTab projectId={selectedProject.id} />
			</main>
		</div>
	);
}
