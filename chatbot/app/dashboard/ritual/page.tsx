import { Suspense } from "react";

function SimpleLoading() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<p className="text-xl">Loading Psychology Engine...</p>
		</div>
	);
}

async function RitualClient() {
	const { RitualPage } = await import(
		"@/components/dashboard/ritual-page"
	);
	const { ProjectsProvider } = await import("@/contexts/projects-context");
	return (
		<ProjectsProvider>
			<RitualPage />
		</ProjectsProvider>
	);
}

export default function RitualDashboard() {
	return (
		<div className="min-h-screen">
			<Suspense fallback={<SimpleLoading />}>
				<RitualClient />
			</Suspense>
		</div>
	);
}
