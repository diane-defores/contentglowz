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
async function DashboardClient({ repoUrl }: { repoUrl: string }) {
	// Dynamically import to ensure client-side only
	const { DashboardContent } = await import(
		"@/components/dashboard/dashboard-content"
	);
	return <DashboardContent repoUrl={repoUrl} />;
}

export default async function DashboardPage({
	searchParams,
}: {
	searchParams: Promise<{
		repo?: string;
	}>;
}) {
	const params = await searchParams;
	const defaultRepo = "https://github.com/dianedef/my-robots";
	const repoUrl = params.repo || defaultRepo;

	return (
		<div className="min-h-screen">
			{/* Static content - should always show */}
			<div className="border-b bg-background p-4">
				<h1 className="text-2xl font-bold">SEO Dashboard</h1>
				<p className="text-sm text-muted-foreground">Repository: {repoUrl}</p>
			</div>

			{/* Dynamic content with Suspense */}
			<Suspense fallback={<SimpleLoading />}>
				<DashboardClient repoUrl={repoUrl} />
			</Suspense>
		</div>
	);
}
