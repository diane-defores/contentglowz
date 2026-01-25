import { DashboardContent } from "@/components/dashboard/dashboard-content";

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

	return <DashboardContent repoUrl={repoUrl} />;
}
