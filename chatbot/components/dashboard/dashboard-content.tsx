"use client";

import {
	AlertCircle,
	Bot,
	Brain,
	Film,
	GitBranch,
	Link as LinkIcon,
	Loader2,
	Mail,
	Search,
	NotebookPen,
	TrendingUp,
	Users,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectsContext } from "@/contexts/projects-context";
import { AffiliationsTab } from "./affiliations-tab";
import { CompetitorsTab } from "./competitors-tab";
import { MissionControl } from "./mission-control";
import { NewsletterTab } from "./newsletter-tab";
import { PipelineTab } from "./pipeline-tab";
import { ProjectSelector } from "./project-selector";
import { ReelsTab } from "./reels-tab";
import { ResearchTab } from "./research-tab";
import { SettingsModal } from "./settings-modal";
import { SubTabs, type SubTab } from "./sub-tabs";

interface DashboardContentProps {
	authToken?: string;
}

const CREATE_SUB_TABS: SubTab[] = [
	{ id: "research", label: "Research", icon: <Search className="h-4 w-4" /> },
	{ id: "newsletter", label: "Newsletter", icon: <Mail className="h-4 w-4" /> },
	{ id: "reels", label: "Reels", icon: <Film className="h-4 w-4" /> },
];

const GROW_SUB_TABS: SubTab[] = [
	{ id: "competitors", label: "Competitors", icon: <Users className="h-4 w-4" /> },
	{ id: "affiliations", label: "Affiliations", icon: <LinkIcon className="h-4 w-4" /> },
];

export function DashboardContent({
	authToken,
}: DashboardContentProps = {}) {
	const { selectedProject } = useProjectsContext();
	const repoUrl = selectedProject?.url || "";
	const [summaryData, setSummaryData] = useState<{ repoName: string; repoUrl: string } | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	// Parse hash into parent + sub-tab (e.g. "#create:newsletter" → ["create", "newsletter"])
	const parseHash = useCallback((): { parent: string; child?: string } => {
		if (typeof window === "undefined") return { parent: "dashboard" };
		const raw = window.location.hash.replace("#", "");
		if (!raw) return { parent: "dashboard" };
		const [parent, child] = raw.split(":");
		return { parent, child };
	}, []);

	const [activeTab, setActiveTab] = useState(() => parseHash().parent);
	const [createSubTab, setCreateSubTab] = useState(() => {
		const { parent, child } = parseHash();
		return parent === "create" && child ? child : "research";
	});
	const [growSubTab, setGrowSubTab] = useState(() => {
		const { parent, child } = parseHash();
		return parent === "grow" && child ? child : "competitors";
	});

	// Sync hash → state on back/forward navigation
	useEffect(() => {
		const onHashChange = () => {
			const { parent, child } = parseHash();
			setActiveTab(parent);
			if (parent === "create" && child) setCreateSubTab(child);
			if (parent === "grow" && child) setGrowSubTab(child);
		};
		window.addEventListener("hashchange", onHashChange);
		return () => window.removeEventListener("hashchange", onHashChange);
	}, [parseHash]);

	// Sync state → hash when tabs change
	useEffect(() => {
		let hash = activeTab;
		if (activeTab === "create") hash = `create:${createSubTab}`;
		if (activeTab === "grow") hash = `grow:${growSubTab}`;
		if (window.location.hash !== `#${hash}`) {
			window.history.replaceState(null, "", `#${hash}`);
		}
	}, [activeTab, createSubTab, growSubTab]);

	useEffect(() => {
		if (!repoUrl) {
			setLoading(false);
			return;
		}
		console.log(`[Dashboard] Setting up dashboard for ${repoUrl}`);
		const repoName = repoUrl.split("/").pop() || "Unknown Repo";
		setSummaryData({ repoName, repoUrl });
		setLoading(false);
	}, [repoUrl]);

	// Handle compound tab navigation (e.g. "create:newsletter")
	const handleNavigateToTab = useCallback((tab: string) => {
		if (tab.includes(":")) {
			const [parent, child] = tab.split(":");
			setActiveTab(parent);
			if (parent === "create") setCreateSubTab(child);
			if (parent === "grow") setGrowSubTab(child);
		} else {
			setActiveTab(tab);
		}
	}, []);

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
						<TabsList className="h-9 flex-1 bg-transparent p-0 justify-between">
							<TabsTrigger value="dashboard" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 h-8 data-[state=active]:bg-muted">
								<Zap className="h-5 w-5" />
								<span className="hidden sm:inline">Dashboard</span>
							</TabsTrigger>
							<TabsTrigger value="create" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 h-8 data-[state=active]:bg-muted">
								<NotebookPen className="h-5 w-5" />
								<span className="hidden sm:inline">Create</span>
							</TabsTrigger>
							<TabsTrigger value="grow" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 h-8 data-[state=active]:bg-muted">
								<TrendingUp className="h-5 w-5" />
								<span className="hidden sm:inline">Grow</span>
							</TabsTrigger>
							<TabsTrigger value="pipeline" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 h-8 data-[state=active]:bg-muted">
								<GitBranch className="h-5 w-5" />
								<span className="hidden sm:inline">Pipeline</span>
							</TabsTrigger>
						</TabsList>
						<div className="flex items-center gap-1.5 shrink-0">
							<ProjectSelector />
							<Button asChild variant="ghost" size="icon" className="h-9 w-9 [&_svg]:size-5" title="Psychology Engine">
								<Link href="/dashboard/ritual">
									<Brain className="h-5 w-5" />
								</Link>
							</Button>
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

					{/* Dashboard Tab (Mission Control) */}
					<TabsContent value="dashboard">
						<MissionControl projectId={selectedProject?.id} onNavigateToTab={handleNavigateToTab} />
					</TabsContent>

					{/* Create Tab — forceMount keeps Newsletter polling + Research chat alive */}
					<TabsContent value="create" forceMount className="data-[state=inactive]:hidden">
						<SubTabs tabs={CREATE_SUB_TABS} activeTab={createSubTab} onTabChange={setCreateSubTab} />

						{/* Research sub-tab */}
						<div className={createSubTab !== "research" ? "hidden" : undefined}>
							<ResearchTab projectId={selectedProject?.id} />
						</div>

						{/* Newsletter sub-tab */}
						<div className={createSubTab !== "newsletter" ? "hidden" : undefined}>
							<NewsletterTab projectId={selectedProject?.id} />
						</div>

						{/* Reels sub-tab */}
						{createSubTab === "reels" && (
							<ReelsTab />
						)}
					</TabsContent>

					{/* Grow Tab */}
					<TabsContent value="grow">
						<SubTabs tabs={GROW_SUB_TABS} activeTab={growSubTab} onTabChange={setGrowSubTab} />

						{growSubTab === "competitors" && (
							<CompetitorsTab projectId={selectedProject?.id} />
						)}

						{growSubTab === "affiliations" && (
							<AffiliationsTab projectId={selectedProject?.id} />
						)}
					</TabsContent>

					{/* Pipeline Tab — Review + Calendar stacked */}
					<TabsContent value="pipeline">
						<PipelineTab projectId={selectedProject?.id} />
					</TabsContent>
			</div>
			</Tabs>
		</div>
	);
}
