"use client";

import {
	AlertCircle,
	Bot,
	CalendarDays,
	FileCheck,
	LayoutTemplate,
	Link as LinkIcon,
	Loader2,
	Mail,
	Search,
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
import { ContentReviewTab } from "./content-review-tab";
import { EditorialCalendarTab } from "./editorial-calendar-tab";
import { MissionControl } from "./mission-control";
import { NewsletterTab } from "./newsletter-tab";
import { ProjectSelector } from "./project-selector";
import { ResearchTab } from "./research-tab";
import { SettingsModal } from "./settings-modal";
import { TemplatesTab } from "./templates-tab";

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
	const [activeTab, setActiveTab] = useState("mission");

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
			<Tabs value={activeTab} onValueChange={setActiveTab}>
			{/* Header */}
			<div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container mx-auto px-3 sm:px-4">
					<div className="flex h-14 items-center gap-2">
						<TabsList className="h-9 flex-1 bg-transparent p-0 justify-around">
							<TabsTrigger value="mission" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 h-8 data-[state=active]:bg-muted">
								<Zap className="h-5 w-5" />
								<span className="hidden sm:inline">Mission Control</span>
							</TabsTrigger>
							<TabsTrigger value="newsletter" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 h-8 data-[state=active]:bg-muted">
								<Mail className="h-5 w-5" />
								<span className="hidden sm:inline">Newsletter</span>
							</TabsTrigger>
							<TabsTrigger value="templates" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 h-8 data-[state=active]:bg-muted">
								<LayoutTemplate className="h-5 w-5" />
								<span className="hidden sm:inline">Templates</span>
							</TabsTrigger>
							<TabsTrigger value="research" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 h-8 data-[state=active]:bg-muted">
								<Search className="h-5 w-5" />
								<span className="hidden sm:inline">Research</span>
							</TabsTrigger>
							<TabsTrigger value="affiliations" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 h-8 data-[state=active]:bg-muted">
								<LinkIcon className="h-5 w-5" />
								<span className="hidden sm:inline">Affiliations</span>
							</TabsTrigger>
							<TabsTrigger value="content" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 h-8 data-[state=active]:bg-muted">
								<FileCheck className="h-5 w-5" />
								<span className="hidden sm:inline">Content</span>
							</TabsTrigger>
							<TabsTrigger value="calendar" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 h-8 data-[state=active]:bg-muted">
								<CalendarDays className="h-5 w-5" />
								<span className="hidden sm:inline">Calendar</span>
							</TabsTrigger>
							<TabsTrigger value="competitors" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 h-8 data-[state=active]:bg-muted">
								<Users className="h-5 w-5" />
								<span className="hidden sm:inline">Competitors</span>
							</TabsTrigger>
						</TabsList>
						<div className="flex items-center gap-1.5 shrink-0">
							<ProjectSelector />
							<Button asChild variant="ghost" size="icon" className="h-9 w-9 [&_svg]:size-5">
								<Link href="/">
									<Bot className="h-5 w-5" />
								</Link>
							</Button>
							<SettingsModal />
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="container mx-auto flex-1 space-y-6 px-4 py-6">
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

					{/* Mission Control Tab */}
					<TabsContent value="mission">
						<MissionControl projectId={selectedProject?.id} onNavigateToTab={setActiveTab} />
					</TabsContent>

					{/* Newsletter Tab — forceMount keeps polling alive across tab switches */}
					<TabsContent value="newsletter" forceMount className="data-[state=inactive]:hidden">
						<NewsletterTab />
					</TabsContent>

					{/* Templates Tab */}
					<TabsContent value="templates">
						<TemplatesTab projectId={selectedProject?.id} />
					</TabsContent>

					{/* Research Tab — forceMount keeps chat state alive across tab switches */}
					<TabsContent value="research" forceMount className="data-[state=inactive]:hidden">
						<ResearchTab projectId={selectedProject?.id} />
					</TabsContent>

					{/* Affiliations Tab */}
					<TabsContent value="affiliations">
						<AffiliationsTab projectId={selectedProject?.id} />
					</TabsContent>

					{/* Content Review Tab */}
					<TabsContent value="content">
						<ContentReviewTab projectId={selectedProject?.id} />
					</TabsContent>

					{/* Editorial Calendar Tab */}
					<TabsContent value="calendar">
						<EditorialCalendarTab projectId={selectedProject?.id} />
					</TabsContent>

					{/* Competitors Tab */}
					<TabsContent value="competitors">
						<CompetitorsTab projectId={selectedProject?.id} />
					</TabsContent>
			</div>
			</Tabs>
		</div>
	);
}
