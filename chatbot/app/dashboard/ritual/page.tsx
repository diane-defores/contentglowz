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
	return <RitualPage />;
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
