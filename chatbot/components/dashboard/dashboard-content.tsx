"use client";

import {
	Activity,
	AlertCircle,
	Bot,
	Link as LinkIcon,
	Loader2,
	Users,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectsContext } from "@/contexts/projects-context";
import { AffiliationsTab } from "./affiliations-tab";
import { CompetitorsTab } from "./competitors-tab";
import { MissionControl } from "./mission-control";
import { ProjectSelector } from "./project-selector";
import { SettingsModal } from "./settings-modal";
import { UptimeTab } from "./uptime-tab";

interface DashboardContentProps {
	repoUrl: string;
	authToken?: string;
}

export function DashboardContent({
	repoUrl,
	authToken,
}: DashboardContentProps) {
	const { selectedProject } = useProjectsContext();
	const [summaryData, setSummaryData] = useState<{ repoName: string; repoUrl: string } | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const loadSummaryData = () => {
		console.log(`[Dashboard] Setting up dashboard for ${repoUrl}`);
		const repoName = repoUrl.split("/").pop() || "Unknown Repo";
		setSummaryData({ repoName, repoUrl });
		setLoading(false);
	};

	useEffect(() => {
		loadSummaryData();
	}, [repoUrl]);

	// Loading state
	if (loading) {
		return (
			<div className="flex min-h-screen flex-col">
				<div className="border-b bg-background">
					<div className="container mx-auto px-4 py-6">
						<div className="flex items-center justify-between">
							<div className="space-y-2">
								<Skeleton className="h-8 w-64" />
								<Skeleton className="h-4 w-96" />
							</div>
							<div className="flex gap-2">
								<Skeleton className="h-9 w-24" />
								<Skeleton className="h-9 w-24" />
							</div>
						</div>
					</div>
				</div>
				<div className="container mx-auto flex-1 space-y-6 px-4 py-8">
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						<span className="ml-3 text-muted-foreground">
							Loading dashboard data...
						</span>
					</div>
				</div>
			</div>
		);
	}

	// No data fallback
	if (!summaryData && !loading && !error) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center p-8">
				<Card className="max-w-md p-8 text-center">
					<h2 className="text-2xl font-bold">No Data Available</h2>
					<p className="mt-2 text-muted-foreground">
						Analyze a repository to see dashboard data
					</p>
					<Button asChild className="mt-4">
						<Link href="/">Go to Chat</Link>
					</Button>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col">
			{/* Header */}
			<div className="border-b bg-background">
				<div className="container mx-auto px-4 py-6">
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div className="flex items-center gap-4">
							<div>
								<h1 className="text-xl sm:text-2xl md:text-3xl font-bold">SEO Dashboard</h1>
								<p className="text-sm text-muted-foreground">{repoUrl}</p>
							</div>
							<ProjectSelector />
						</div>
						<div className="flex gap-2">
							<Button asChild variant="outline" size="sm">
								<Link href="/">
									<Bot className="mr-2 h-4 w-4" />
									Chatbot
								</Link>
							</Button>
							<SettingsModal />
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="container mx-auto flex-1 space-y-6 px-4 py-8">
				{/* Error Banner (non-blocking) */}
				{error && (
					<div className="rounded-lg border border-red-200 bg-red-50 p-4">
						<div className="flex items-center gap-3">
							<AlertCircle className="h-5 w-5 text-red-500" />
							<div className="flex-1">
								<p className="text-sm font-medium text-red-800">API Error</p>
								<p className="text-sm text-red-600">{error}</p>
							</div>
							<Button onClick={() => setError(null)} variant="ghost" size="sm">
								Dismiss
							</Button>
						</div>
					</div>
				)}


				{/* Tabs Navigation */}
				<Tabs defaultValue="mission" className="space-y-6">
					<div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
						<TabsList className="inline-flex w-max sm:w-auto">
							<TabsTrigger value="mission" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2.5 sm:px-3">
								<Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
								<span className="hidden sm:inline">Mission Control</span>
								<span className="sm:hidden">Mission</span>
							</TabsTrigger>
							<TabsTrigger value="uptime" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2.5 sm:px-3">
								<Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
								<span>Uptime</span>
							</TabsTrigger>
							<TabsTrigger value="affiliations" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2.5 sm:px-3">
								<LinkIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
								<span className="hidden sm:inline">Affiliations</span>
								<span className="sm:hidden">Affil.</span>
							</TabsTrigger>
							<TabsTrigger value="competitors" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2.5 sm:px-3">
								<Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
								<span className="hidden sm:inline">Competitors</span>
								<span className="sm:hidden">Comp.</span>
							</TabsTrigger>
						</TabsList>
					</div>

					{/* Mission Control Tab */}
					<TabsContent value="mission">
						<MissionControl projectId={selectedProject?.id} />
					</TabsContent>

					{/* Uptime Tab */}
					<TabsContent value="uptime">
						<UptimeTab />
					</TabsContent>

					{/* Affiliations Tab */}
					<TabsContent value="affiliations">
						<AffiliationsTab projectId={selectedProject?.id} />
					</TabsContent>

					{/* Competitors Tab */}
					<TabsContent value="competitors">
						<CompetitorsTab projectId={selectedProject?.id} />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
