import { Suspense } from "react";

// Simple loading component
function SimpleLoading() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<p className="text-xl">Loading dashboard...</p>
		</div>
	);
}

// Client component for dynamic content
async function DashboardClient() {
	// Dynamically import to ensure client-side only
	const { DashboardContent } = await import(
		"@/components/dashboard/dashboard-content"
	);
	const { ProjectsProvider } = await import("@/contexts/projects-context");
	return (
		<ProjectsProvider>
			<DashboardContent />
		</ProjectsProvider>
	);
}

export default function DashboardPage() {
	return (
		<div className="min-h-screen">
			<Suspense fallback={<SimpleLoading />}>
				<DashboardClient />
			</Suspense>
		</div>
	);
}
