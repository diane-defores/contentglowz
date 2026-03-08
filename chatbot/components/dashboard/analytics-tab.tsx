"use client";

import {
	ArrowUpRight,
	BarChart3,
	ExternalLink,
	Globe,
	Loader2,
	Settings,
	TrendingUp,
	Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics, type DateRange } from "@/hooks/use-analytics";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return n.toLocaleString();
}

function formatDate(dateStr: string, range: DateRange): string {
	const d = new Date(dateStr);
	if (range === "7d") {
		return d.toLocaleDateString("en-US", { weekday: "short" });
	}
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Setup State ──────────────────────────────────────────────────────────────

function openSettingsTab(tab: string) {
	window.dispatchEvent(
		new CustomEvent("open-settings", { detail: { tab } }),
	);
}

function SetupState({ reason }: { reason?: "api_key" | "project_id" }) {
	const needsApiKey = !reason || reason === "api_key";
	const needsProjectId = !reason || reason === "project_id";

	return (
		<div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 sm:py-16 text-center">
			<BarChart3 className="mb-3 h-10 w-10 text-muted-foreground sm:mb-4 sm:h-12 sm:w-12" />
			<h3 className="text-base font-semibold sm:text-lg">
				{needsApiKey
					? "Connect PostHog Analytics"
					: "Link a PostHog Project"}
			</h3>
			<p className="mt-1.5 max-w-md text-xs text-muted-foreground sm:mt-2 sm:text-sm">
				{needsApiKey
					? "See real visitor data, top pages, referral sources, and geographic insights. Free for up to 1M events/month."
					: "Your PostHog API key is configured. Now link a PostHog project to this project to start seeing analytics."}
			</p>

			<div className="mt-5 w-full max-w-md space-y-2.5 text-left sm:mt-8 sm:space-y-4">
				{needsApiKey && (
					<div className="flex items-start gap-2.5 rounded-lg border bg-muted/40 p-3 sm:gap-3 sm:p-4">
						<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground sm:h-6 sm:w-6 sm:text-xs">
							1
						</span>
						<div>
							<p className="text-xs font-medium sm:text-sm">Create a PostHog account</p>
							<a
								href="https://posthog.com"
								target="_blank"
								rel="noopener noreferrer"
								className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground sm:text-xs"
							>
								posthog.com
								<ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
							</a>
						</div>
					</div>
				)}

				{needsApiKey && (
					<button
						type="button"
						onClick={() => openSettingsTab("api-keys")}
						className="flex w-full items-start gap-2.5 rounded-lg border border-primary/50 bg-primary/5 p-3 text-left transition-colors hover:bg-primary/10 sm:gap-3 sm:p-4"
					>
						<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground sm:h-6 sm:w-6 sm:text-xs">
							2
						</span>
						<div>
							<p className="text-xs font-medium sm:text-sm">Add your PostHog Personal API Key</p>
							<p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">
								Go to Settings &rarr; API Keys and paste your key from PostHog &rarr; Settings &rarr; Personal API Keys.
							</p>
						</div>
					</button>
				)}

				<button
					type="button"
					onClick={() => openSettingsTab("projects")}
					className={`flex w-full items-start gap-2.5 rounded-lg border p-3 text-left transition-colors sm:gap-3 sm:p-4 ${
						needsProjectId && !needsApiKey
							? "border-primary/50 bg-primary/5 hover:bg-primary/10"
							: "bg-muted/40 hover:bg-muted/60"
					}`}
				>
					<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground sm:h-6 sm:w-6 sm:text-xs">
						{needsApiKey ? "3" : "1"}
					</span>
					<div>
						<p className="text-xs font-medium sm:text-sm">Link a PostHog Project</p>
						<p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">
							Go to Settings &rarr; Projects &rarr; edit your project and select the PostHog project to connect.
						</p>
					</div>
				</button>
			</div>

			<Button
				variant="outline"
				size="sm"
				className="mt-4 sm:mt-6"
				onClick={() => openSettingsTab(needsApiKey ? "api-keys" : "projects")}
			>
				<Settings className="mr-1.5 h-3.5 w-3.5" />
				{needsApiKey ? "Open API Keys Settings" : "Open Project Settings"}
			</Button>
		</div>
	);
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────

function AnalyticsSkeleton() {
	return (
		<div className="space-y-3 sm:space-y-6">
			<div className="grid grid-cols-3 gap-2 sm:gap-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<Card key={i} className="p-2.5 sm:p-4">
						<Skeleton className="h-3 w-12 sm:h-4 sm:w-24" />
						<Skeleton className="mt-1.5 h-6 w-10 sm:mt-2 sm:h-8 sm:w-16" />
					</Card>
				))}
			</div>
			<Card className="p-3 sm:p-6">
				<Skeleton className="h-3 w-20 sm:h-4 sm:w-32" />
				<Skeleton className="mt-3 h-32 w-full sm:mt-4 sm:h-48" />
			</Card>
			<div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
				<Card className="p-3 sm:p-6">
					<Skeleton className="h-3 w-20 sm:h-4 sm:w-28" />
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="mt-2 h-4 w-full sm:mt-3 sm:h-6" />
					))}
				</Card>
				<Card className="p-3 sm:p-6">
					<Skeleton className="h-3 w-20 sm:h-4 sm:w-28" />
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="mt-2 h-4 w-full sm:mt-3 sm:h-6" />
					))}
				</Card>
			</div>
		</div>
	);
}

// ── Bar Chart (CSS-only) ─────────────────────────────────────────────────────

function PageviewsChart({
	pageviews,
	dateRange,
}: {
	pageviews: { date: string; count: number }[];
	dateRange: DateRange;
}) {
	const maxCount = Math.max(...pageviews.map((d) => d.count), 1);

	return (
		<Card>
			<CardHeader className="px-3 py-2 sm:px-6 sm:pb-2">
				<CardTitle className="text-xs font-semibold sm:text-sm">Pageviews</CardTitle>
			</CardHeader>
			<CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
				<div className="flex items-end gap-[2px] h-32 sm:gap-1 sm:h-48">
					{pageviews.map((d) => {
						const pct = (d.count / maxCount) * 100;
						return (
							<div
								key={d.date}
								className="group relative flex flex-1 flex-col items-center justify-end h-full"
							>
								<div className="absolute -top-6 hidden rounded bg-popover px-1.5 py-0.5 text-[10px] font-medium text-popover-foreground shadow group-hover:block whitespace-nowrap z-10 sm:px-2 sm:py-1 sm:text-xs">
									{d.count.toLocaleString()}
								</div>
								<div
									className="w-full min-w-[2px] max-w-[32px] rounded-t bg-primary transition-all hover:bg-primary/80 sm:min-w-[4px]"
									style={{ height: `${Math.max(pct, 2)}%` }}
								/>
							</div>
						);
					})}
				</div>
				<div className="mt-1.5 flex gap-[2px] sm:mt-2 sm:gap-1">
					{pageviews.map((d, i) => {
						const showLabel =
							dateRange === "7d" ||
							(dateRange === "30d" && i % 7 === 0) ||
							(dateRange === "90d" && i % 15 === 0) ||
							i === pageviews.length - 1;
						return (
							<div key={d.date} className="flex-1 text-center">
								{showLabel && (
									<span className="text-[8px] text-muted-foreground sm:text-[10px]">
										{formatDate(d.date, dateRange)}
									</span>
								)}
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}

// ── Countries Chart (horizontal bars) ────────────────────────────────────────

function CountriesChart({
	countries,
}: {
	countries: { country: string; count: number }[];
}) {
	const top5 = countries.slice(0, 5);
	const maxCount = Math.max(...top5.map((c) => c.count), 1);

	return (
		<Card>
			<CardHeader className="px-3 py-2 sm:px-6 sm:pb-2">
				<div className="flex items-center gap-1.5 sm:gap-2">
					<Globe className="h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />
					<CardTitle className="text-xs font-semibold sm:text-sm">Top Countries</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="space-y-2 px-3 pb-3 sm:space-y-3 sm:px-6 sm:pb-6">
				{top5.length === 0 && (
					<p className="text-xs text-muted-foreground sm:text-sm">No data yet</p>
				)}
				{top5.map((c) => {
					const pct = (c.count / maxCount) * 100;
					return (
						<div key={c.country} className="space-y-0.5 sm:space-y-1">
							<div className="flex items-center justify-between text-xs sm:text-sm">
								<span className="font-medium">{c.country}</span>
								<span className="text-muted-foreground">
									{formatNumber(c.count)}
								</span>
							</div>
							<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted sm:h-2">
								<div
									className="h-full rounded-full bg-primary/70 transition-all"
									style={{ width: `${pct}%` }}
								/>
							</div>
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}

// ── Main Tab ─────────────────────────────────────────────────────────────────

interface AnalyticsTabProps {
	projectId?: string;
}

export function AnalyticsTab({ projectId }: AnalyticsTabProps) {
	const { data, loading, error, dateRange, setDateRange, refresh } =
		useAnalytics(projectId);

	// Not configured state
	if (!loading && error?.startsWith("not_configured")) {
		const reason = error.split(":")[1] as "api_key" | "project_id" | undefined;
		return <SetupState reason={reason} />;
	}

	// Loading state
	if (loading && !data) {
		return <AnalyticsSkeleton />;
	}

	// Error state
	if (error && !error.startsWith("not_configured")) {
		return (
			<div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center dark:border-red-900 dark:bg-red-950/20 sm:py-12">
				<BarChart3 className="mb-2 h-6 w-6 text-red-500 sm:mb-3 sm:h-8 sm:w-8" />
				<p className="text-sm font-medium text-red-800 dark:text-red-400">
					Failed to load analytics
				</p>
				<p className="mt-1 max-w-sm text-xs text-red-600 dark:text-red-500 sm:text-sm">{error}</p>
				<Button onClick={refresh} variant="outline" size="sm" className="mt-3 sm:mt-4">
					Try Again
				</Button>
			</div>
		);
	}

	// No data state
	if (!data) {
		return (
			<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center sm:py-16">
				<BarChart3 className="mb-2 h-6 w-6 text-muted-foreground sm:mb-3 sm:h-8 sm:w-8" />
				<p className="text-sm font-medium">No analytics data available</p>
				<p className="mt-1 text-xs text-muted-foreground sm:text-sm">
					Select a project to view analytics
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3 sm:space-y-6">
			{/* Header with date range selector */}
			<div className="flex items-center justify-between gap-2">
				<div className="min-w-0">
					<h2 className="text-base font-semibold sm:text-xl">Analytics</h2>
					<p className="hidden text-sm text-muted-foreground sm:block">
						Visitor insights from PostHog
					</p>
				</div>
				<div className="flex items-center gap-1.5 sm:gap-2">
					<Select
						value={dateRange}
						onValueChange={(v) => setDateRange(v as DateRange)}
					>
						<SelectTrigger className="h-8 w-[90px] text-xs sm:h-9 sm:w-[120px] sm:text-sm">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="7d">7 days</SelectItem>
							<SelectItem value="30d">30 days</SelectItem>
							<SelectItem value="90d">90 days</SelectItem>
						</SelectContent>
					</Select>
					<Button
						onClick={refresh}
						variant="outline"
						size="icon"
						className="h-8 w-8 sm:h-9 sm:w-9"
						disabled={loading}
					>
						{loading ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
						) : (
							<ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
						)}
					</Button>
				</div>
			</div>

			{/* Summary cards — always 3 columns */}
			<div className="grid grid-cols-3 gap-2 sm:gap-4">
				<Card className="p-2.5 sm:p-4">
					<div className="flex items-center gap-1 text-[10px] text-muted-foreground sm:gap-2 sm:text-sm">
						<TrendingUp className="hidden h-4 w-4 sm:block" />
						Pageviews
					</div>
					<div className="mt-0.5 text-lg font-bold sm:mt-1 sm:text-2xl">
						{formatNumber(data.totalPageviews)}
					</div>
				</Card>
				<Card className="p-2.5 sm:p-4">
					<div className="flex items-center gap-1 text-[10px] text-muted-foreground sm:gap-2 sm:text-sm">
						<Users className="hidden h-4 w-4 sm:block" />
						Visitors
					</div>
					<div className="mt-0.5 text-lg font-bold sm:mt-1 sm:text-2xl">
						{formatNumber(data.totalVisitors)}
					</div>
				</Card>
				<Card className="p-2.5 sm:p-4">
					<div className="flex items-center gap-1 text-[10px] text-muted-foreground sm:gap-2 sm:text-sm">
						<BarChart3 className="hidden h-4 w-4 sm:block" />
						Avg/Day
					</div>
					<div className="mt-0.5 text-lg font-bold sm:mt-1 sm:text-2xl">
						{formatNumber(Math.round(data.avgPageviewsPerDay))}
					</div>
				</Card>
			</div>

			{/* Pageviews chart */}
			<PageviewsChart pageviews={data.pageviews} dateRange={dateRange} />

			{/* Top Pages + Referral Sources */}
			<div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
				<Card>
					<CardHeader className="px-3 py-2 sm:px-6 sm:pb-2">
						<CardTitle className="text-xs font-semibold sm:text-sm">Top Pages</CardTitle>
					</CardHeader>
					<CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
						{data.topPages.length === 0 ? (
							<p className="text-xs text-muted-foreground">No data yet</p>
						) : (
							<div className="space-y-1.5 sm:space-y-2">
								{data.topPages.slice(0, 10).map((page, i) => (
									<div
										key={page.path}
										className="flex items-center justify-between gap-1.5 text-xs sm:gap-2 sm:text-sm"
									>
										<div className="flex items-center gap-1 min-w-0 sm:gap-2">
											<span className="shrink-0 text-[10px] text-muted-foreground w-4 text-right sm:text-xs sm:w-5">
												{i + 1}.
											</span>
											<span
												className="truncate font-mono text-[10px] sm:text-xs"
												title={page.path}
											>
												{page.path}
											</span>
										</div>
										<span className="shrink-0 tabular-nums text-muted-foreground text-[10px] sm:text-sm">
											{formatNumber(page.count)}
										</span>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="px-3 py-2 sm:px-6 sm:pb-2">
						<CardTitle className="text-xs font-semibold sm:text-sm">
							Referrals
						</CardTitle>
					</CardHeader>
					<CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
						{data.referralSources.length === 0 ? (
							<p className="text-xs text-muted-foreground">No data yet</p>
						) : (
							<div className="space-y-1.5 sm:space-y-2">
								{data.referralSources.slice(0, 10).map((ref, i) => (
									<div
										key={ref.source}
										className="flex items-center justify-between gap-1.5 text-xs sm:gap-2 sm:text-sm"
									>
										<div className="flex items-center gap-1 min-w-0 sm:gap-2">
											<span className="shrink-0 text-[10px] text-muted-foreground w-4 text-right sm:text-xs sm:w-5">
												{i + 1}.
											</span>
											<span className="truncate text-[10px] sm:text-xs">{ref.source}</span>
										</div>
										<span className="shrink-0 tabular-nums text-muted-foreground text-[10px] sm:text-sm">
											{formatNumber(ref.count)}
										</span>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Countries */}
			<CountriesChart countries={data.topCountries} />
		</div>
	);
}
