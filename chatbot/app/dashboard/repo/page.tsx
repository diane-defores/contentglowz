import { Suspense } from "react";

function RepoLoading() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<p className="text-xl">Loading repository browser...</p>
		</div>
	);
}

async function RepoClient() {
	const { RepoBrowserPage } = await import(
		"@/components/dashboard/repo-browser-page"
	);
	return <RepoBrowserPage />;
}

export default function RepoPage() {
	return (
		<div className="min-h-screen">
			<Suspense fallback={<RepoLoading />}>
				<RepoClient />
			</Suspense>
		</div>
	);
}
