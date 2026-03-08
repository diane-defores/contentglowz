"use client";

import { ProjectsProvider } from "@/contexts/projects-context";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <ProjectsProvider>{children}</ProjectsProvider>;
}
