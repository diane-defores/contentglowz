import { Suspense } from "react";

function TemplatesLoading() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<p className="text-xl">Loading templates...</p>
		</div>
	);
}

async function TemplatesClient() {
	const { TemplatesPage } = await import(
		"@/components/dashboard/templates-page"
	);
	return <TemplatesPage />;
}

export default function TemplatesRoute() {
	return (
		<div className="min-h-screen">
			<Suspense fallback={<TemplatesLoading />}>
				<TemplatesClient />
			</Suspense>
		</div>
	);
}
