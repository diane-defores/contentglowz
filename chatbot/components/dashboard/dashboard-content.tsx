"use client";

import {
	Activity,
	AlertCircle,
	Bot,
	Cpu,
	Link as LinkIcon,
	Loader2,
	RefreshCw,
	Settings,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { analysisCache } from "@/lib/cache";
import { seoApi } from "@/lib/seo-api-client";
import { AffiliationsTab } from "./affiliations-tab";
import { CompetitorsTab } from "./competitors-tab";
import { RobotsTab } from "./robots-tab";
import { UptimeTab } from "./uptime-tab";

interface DashboardContentProps {
	repoUrl: string;
	authToken?: string;
}

export function DashboardContent({
	repoUrl,
	authToken,
}: DashboardContentProps) {
	const [summaryData, setSummaryData] = useState<{ repoName: string; repoUrl: string } | null>(null);
	const [analysisResults, setAnalysisResults] = useState<Record<string, any>>(
		{},
	);
	const [runningAnalyses, setRunningAnalyses] = useState<Set<string>>(
		new Set(),
	);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const loadSummaryData = () => {
		console.log(`[Dashboard] Setting up dashboard for ${repoUrl}`);
		const repoName = repoUrl.split("/").pop() || "Unknown Repo";
		setSummaryData({ repoName, repoUrl });
		setLoading(false);
	};

	const loadCachedResults = () => {
		// Load cached analysis results for this repo
		const analysisTypes = ["mesh", "competitors", "internal-linking"];
		const cachedResults: Record<string, any> = {};

		analysisTypes.forEach((type) => {
			const cached = analysisCache.get(type, repoUrl);
			if (cached) {
				console.log(`[Dashboard] Found cached ${type} results`);
				cachedResults[type] = cached;
			}
		});

		if (Object.keys(cachedResults).length > 0) {
			setAnalysisResults(cachedResults);
		}
	};

	const clearCache = () => {
		// Clear all cached results for this repo
		console.log(`[Dashboard] Clearing cache for ${repoUrl}`);
		const analysisTypes = ["mesh", "competitors", "internal-linking"];
		analysisTypes.forEach((type) => {
			analysisCache.delete(type, repoUrl);
		});
		setAnalysisResults({});
	};

	const runAnalysis = async (analysisType: string, forceRefresh = false) => {
		if (runningAnalyses.has(analysisType)) return;

		console.log(
			`[Dashboard] Running ${analysisType} analysis (forceRefresh: ${forceRefresh})`,
		);

		// Check cache first unless force refresh
		if (!forceRefresh) {
			const cachedResult = analysisCache.get(analysisType, repoUrl);
			if (cachedResult) {
				console.log(`[Dashboard] Using cached ${analysisType} result`);
				setAnalysisResults((prev) => ({
					...prev,
					[analysisType]: cachedResult,
				}));
				return;
			}
		}

		setRunningAnalyses((prev) => new Set(prev).add(analysisType));
		try {
			let result;
			switch (analysisType) {
				case "mesh":
					console.log("[Dashboard] Calling analyzeMesh API");
					result = await seoApi.analyzeMesh(repoUrl);
					break;
				case "competitors":
					console.log("[Dashboard] Calling analyzeCompetitors API");
					result = await seoApi.analyzeCompetitors([
						"seo",
						"content marketing",
					]);
					break;
				case "internal-linking":
					console.log("[Dashboard] Calling analyzeInternalLinking API");
					result = await seoApi.analyzeInternalLinking(repoUrl);
					break;
				default:
					throw new Error(`Unknown analysis type: ${analysisType}`);
			}

			console.log(`[Dashboard] ${analysisType} analysis result:`, result);

			// Cache the result
			analysisCache.set(analysisType, repoUrl, result);
			setAnalysisResults((prev) => ({ ...prev, [analysisType]: result }));
		} catch (err) {
			console.error(`[Dashboard] Analysis ${analysisType} failed:`, err);
			const errorResult = {
				error: err instanceof Error ? err.message : "Analysis failed",
			};
			setAnalysisResults((prev) => ({
				...prev,
				[analysisType]: errorResult,
			}));
		} finally {
			setRunningAnalyses((prev) => {
				const newSet = new Set(prev);
				newSet.delete(analysisType);
				return newSet;
			});
		}
	};

	useEffect(() => {
		loadSummaryData();
		loadCachedResults();
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
						<div>
							<h1 className="text-3xl font-bold">SEO Dashboard</h1>
							<p className="text-sm text-muted-foreground">{repoUrl}</p>
						</div>
						<div className="flex gap-2">
							<Button asChild variant="outline" size="sm">
								<Link href="/">
									<Bot className="mr-2 h-4 w-4" />
									Chatbot
								</Link>
							</Button>
							<Button
								onClick={clearCache}
								variant="outline"
								size="sm"
								title="Clear all cached analysis results"
							>
								<RefreshCw className="mr-2 h-4 w-4" />
								Clear Cache
							</Button>
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
				<Tabs defaultValue="seo" className="space-y-6">
					<TabsList>
						<TabsTrigger value="seo" className="flex items-center gap-2">
							<Bot className="h-4 w-4" />
							SEO Analysis
						</TabsTrigger>
						<TabsTrigger value="robots" className="flex items-center gap-2">
							<Cpu className="h-4 w-4" />
							Robots
						</TabsTrigger>
						<TabsTrigger value="uptime" className="flex items-center gap-2">
							<Activity className="h-4 w-4" />
							Uptime
						</TabsTrigger>
						<TabsTrigger value="affiliations" className="flex items-center gap-2">
							<LinkIcon className="h-4 w-4" />
							Affiliations
						</TabsTrigger>
						<TabsTrigger value="competitors" className="flex items-center gap-2">
							<Users className="h-4 w-4" />
							Competitors
						</TabsTrigger>
					</TabsList>

					{/* SEO Analysis Tab */}
					<TabsContent value="seo" className="space-y-6">
						{/* Analysis Tools */}
						<section className="space-y-4">
							<h2 className="text-2xl font-bold">SEO Analysis Tools</h2>
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								<Card className="p-6">
									<div className="space-y-4">
										<div className="flex items-center gap-3">
											<div className="p-2 bg-blue-100 rounded-lg">
												<Bot className="h-6 w-6 text-blue-600" />
											</div>
											<div>
												<h3 className="font-semibold">Topical Mesh Analysis</h3>
												<p className="text-sm text-muted-foreground">
													Analyze content structure and authority
												</p>
											</div>
										</div>
										<div className="flex gap-2">
											<Button
												onClick={() => runAnalysis("mesh")}
												disabled={runningAnalyses.has("mesh")}
												className="flex-1"
											>
												{runningAnalyses.has("mesh") ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														Analyzing...
													</>
												) : analysisResults.mesh ? (
													"Run Analysis"
												) : (
													"Run Analysis"
												)}
											</Button>
											{analysisResults.mesh && (
												<Button
													onClick={() => runAnalysis("mesh", true)}
													disabled={runningAnalyses.has("mesh")}
													variant="outline"
													size="sm"
													title="Refresh from server (bypass cache)"
												>
													<RefreshCw className="h-4 w-4" />
												</Button>
											)}
										</div>
										{analysisResults.mesh && (
											<div className="text-xs text-green-600">
												✓ Analysis complete (cached)
											</div>
										)}
									</div>
								</Card>

								<Card className="p-6">
									<div className="space-y-4">
										<div className="flex items-center gap-3">
											<div className="p-2 bg-purple-100 rounded-lg">
												<Settings className="h-6 w-6 text-purple-600" />
											</div>
											<div>
												<h3 className="font-semibold">Internal Linking Audit</h3>
												<p className="text-sm text-muted-foreground">
													Check link structure and opportunities
												</p>
											</div>
										</div>
										<div className="flex gap-2">
											<Button
												onClick={() => runAnalysis("internal-linking")}
												disabled={runningAnalyses.has("internal-linking")}
												className="flex-1"
											>
												{runningAnalyses.has("internal-linking") ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														Analyzing...
													</>
												) : (
													"Run Analysis"
												)}
											</Button>
											{analysisResults["internal-linking"] && (
												<Button
													onClick={() => runAnalysis("internal-linking", true)}
													disabled={runningAnalyses.has("internal-linking")}
													variant="outline"
													size="sm"
													title="Refresh from server (bypass cache)"
												>
													<RefreshCw className="h-4 w-4" />
												</Button>
											)}
										</div>
										{analysisResults["internal-linking"] && (
											<div className="text-xs text-green-600">
												✓ Analysis complete (cached)
											</div>
										)}
									</div>
								</Card>

								<Card className="p-6">
									<div className="space-y-4">
										<div className="flex items-center gap-3">
											<div className="p-2 bg-orange-100 rounded-lg">
												<RefreshCw className="h-6 w-6 text-orange-600" />
											</div>
											<div>
												<h3 className="font-semibold">Competitor Analysis</h3>
												<p className="text-sm text-muted-foreground">
													Compare with market leaders
												</p>
											</div>
										</div>
										<div className="flex gap-2">
											<Button
												onClick={() => runAnalysis("competitors")}
												disabled={runningAnalyses.has("competitors")}
												className="flex-1"
											>
												{runningAnalyses.has("competitors") ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														Analyzing...
													</>
												) : (
													"Run Analysis"
												)}
											</Button>
											{analysisResults.competitors && (
												<Button
													onClick={() => runAnalysis("competitors", true)}
													disabled={runningAnalyses.has("competitors")}
													variant="outline"
													size="sm"
													title="Refresh from server (bypass cache)"
												>
													<RefreshCw className="h-4 w-4" />
												</Button>
											)}
										</div>
										{analysisResults.competitors && (
											<div className="text-xs text-green-600">
												✓ Analysis complete (cached)
											</div>
										)}
									</div>
								</Card>
							</div>
						</section>

						{/* Analysis Results */}
						{Object.keys(analysisResults).length > 0 && (
							<section className="space-y-4">
								<h2 className="text-2xl font-bold">Analysis Results</h2>
								{analysisResults.mesh && !analysisResults.mesh.error && (
									<Card className="p-6">
										<h3 className="text-lg font-semibold mb-4">
											Topical Mesh Analysis
										</h3>
										<div className="grid gap-4 md:grid-cols-3">
											<div className="text-center">
												<div className="text-2xl font-bold text-blue-600">
													{analysisResults.mesh.authority_score || 0}
												</div>
												<div className="text-sm text-muted-foreground">
													Authority Score
												</div>
											</div>
											<div className="text-center">
												<div className="text-2xl font-bold text-green-600">
													{analysisResults.mesh.total_pages || 0}
												</div>
												<div className="text-sm text-muted-foreground">
													Total Pages
												</div>
											</div>
											<div className="text-center">
												<div className="text-2xl font-bold text-purple-600">
													{analysisResults.mesh.total_links || 0}
												</div>
												<div className="text-sm text-muted-foreground">
													Total Links
												</div>
											</div>
										</div>
										{analysisResults.mesh.recommendations &&
											analysisResults.mesh.recommendations.length > 0 && (
												<div className="mt-4">
													<h4 className="font-semibold mb-2">
														Top Recommendations:
													</h4>
													<ul className="list-disc list-inside space-y-1 text-sm">
														{analysisResults.mesh.recommendations
															.slice(0, 3)
															.map((rec: any, i: number) => (
																<li key={i}>{rec.action || rec.title}</li>
															))}
													</ul>
												</div>
											)}
									</Card>
								)}

								{analysisResults["internal-linking"] &&
									!analysisResults["internal-linking"].error && (
										<Card className="p-6">
											<h3 className="text-lg font-semibold mb-4">
												Internal Linking Analysis
											</h3>
											<div className="text-sm text-muted-foreground">
												Analysis completed.{" "}
												{analysisResults["internal-linking"].total_opportunities ||
													0}{" "}
												linking opportunities found.
											</div>
										</Card>
									)}

								{analysisResults.competitors &&
									!analysisResults.competitors.error && (
										<Card className="p-6">
											<h3 className="text-lg font-semibold mb-4">
												Competitor Analysis
											</h3>
											<div className="text-sm text-muted-foreground">
												Analysis completed for{" "}
												{analysisResults.competitors.competitors?.length || 0}{" "}
												competitors.
											</div>
										</Card>
									)}
							</section>
						)}
					</TabsContent>

					{/* Robots Tab */}
					<TabsContent value="robots">
						<RobotsTab />
					</TabsContent>

					{/* Uptime Tab */}
					<TabsContent value="uptime">
						<UptimeTab />
					</TabsContent>

					{/* Affiliations Tab */}
					<TabsContent value="affiliations">
						<AffiliationsTab />
					</TabsContent>

					{/* Competitors Tab */}
					<TabsContent value="competitors">
						<CompetitorsTab />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
