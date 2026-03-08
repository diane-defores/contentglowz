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

function SetupState() {
	return (
		<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
			<BarChart3 className="mb-4 h-12 w-12 text-muted-foreground" />
			<h3 className="text-lg font-semibold">Connect PostHog Analytics</h3>
			<p className="mt-2 max-w-md text-sm text-muted-foreground">
				See real visitor data, top pages, referral sources, and geographic
				insights for your site. PostHog is free for up to 1M events/month.
			</p>

			<div className="mt-8 w-full max-w-md space-y-4 text-left">
				<div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
					<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
						1
					</span>
					<div>
						<p className="text-sm font-medium">Create a PostHog account</p>
						<a
							href="https://posthog.com"
							target="_blank"
							rel="noopener noreferrer"
							className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
						>
							posthog.com
							<ExternalLink className="h-3 w-3" />
						</a>
					</div>
				</div>

				<div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
					<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
						2
					</span>
					<div>
						<p className="text-sm font-medium">Add a Personal API Key</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							Settings &rarr; API Keys &rarr; Analytics
						</p>
					</div>
				</div>

				<div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
					<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
						3
					</span>
					<div>
						<p className="text-sm font-medium">Set your PostHog Project ID</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							Settings &rarr; Projects &rarr; Edit
						</p>
					</div>
				</div>
			</div>

			<Button
				variant="outline"
				className="mt-6"
				onClick={() => {
					// Trigger settings modal via hash or dispatch
					const settingsBtn = document.querySelector<HTMLButtonElement>(
						'[data-settings-trigger="true"]',
					);
					settingsBtn?.click();
				}}
			>
				<Settings className="mr-2 h-4 w-4" />
				Open Settings
			</Button>
		</div>
	);
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────

function AnalyticsSkeleton() {
	return (
		<div className="space-y-6">
			{/* Summary cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<Card key={i} className="p-4">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="mt-2 h-8 w-16" />
					</Card>
				))}
			</div>
			{/* Chart */}
			<Card className="p-6">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="mt-4 h-48 w-full" />
			</Card>
			{/* Tables */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Card className="p-6">
					<Skeleton className="h-4 w-28" />
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="mt-3 h-6 w-full" />
					))}
				</Card>
				<Card className="p-6">
					<Skeleton className="h-4 w-28" />
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="mt-3 h-6 w-full" />
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
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-semibold">Pageviews</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex items-end gap-1 h-48">
					{pageviews.map((d) => {
						const pct = (d.count / maxCount) * 100;
						return (
							<div
								key={d.date}
								className="group relative flex flex-1 flex-col items-center justify-end h-full"
							>
								{/* Tooltip */}
								<div className="absolute -top-6 hidden rounded bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow group-hover:block whitespace-nowrap z-10">
									{d.count.toLocaleString()}
								</div>
								{/* Bar */}
								<div
									className="w-full min-w-[4px] max-w-[32px] rounded-t bg-primary transition-all hover:bg-primary/80"
									style={{ height: `${Math.max(pct, 2)}%` }}
								/>
							</div>
						);
					})}
				</div>
				{/* X-axis labels */}
				<div className="mt-2 flex gap-1">
					{pageviews.map((d, i) => {
						// Show a subset of labels to avoid crowding
						const showLabel =
							dateRange === "7d" ||
							(dateRange === "30d" && i % 5 === 0) ||
							(dateRange === "90d" && i % 10 === 0) ||
							i === pageviews.length - 1;
						return (
							<div key={d.date} className="flex-1 text-center">
								{showLabel && (
									<span className="text-[10px] text-muted-foreground">
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
			<CardHeader className="pb-2">
				<div className="flex items-center gap-2">
					<Globe className="h-4 w-4 text-muted-foreground" />
					<CardTitle className="text-sm font-semibold">Top Countries</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				{top5.length === 0 && (
					<p className="text-sm text-muted-foreground">No data yet</p>
				)}
				{top5.map((c) => {
					const pct = (c.count / maxCount) * 100;
					return (
						<div key={c.country} className="space-y-1">
							<div className="flex items-center justify-between text-sm">
								<span className="font-medium">{c.country}</span>
								<span className="text-muted-foreground">
									{formatNumber(c.count)}
								</span>
							</div>
							<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
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
	if (!loading && error === "not_configured") {
		return <SetupState />;
	}

	// Loading state
	if (loading && !data) {
		return <AnalyticsSkeleton />;
	}

	// Error state
	if (error && error !== "not_configured") {
		return (
			<div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 py-12 text-center dark:border-red-900 dark:bg-red-950/20">
				<BarChart3 className="mb-3 h-8 w-8 text-red-500" />
				<p className="font-medium text-red-800 dark:text-red-400">
					Failed to load analytics
				</p>
				<p className="mt-1 text-sm text-red-600 dark:text-red-500">{error}</p>
				<Button onClick={refresh} variant="outline" size="sm" className="mt-4">
					Try Again
				</Button>
			</div>
		);
	}

	// No data state
	if (!data) {
		return (
			<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
				<BarChart3 className="mb-3 h-8 w-8 text-muted-foreground" />
				<p className="font-medium">No analytics data available</p>
				<p className="mt-1 text-sm text-muted-foreground">
					Select a project to view analytics
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header with date range selector */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-xl font-semibold">Analytics</h2>
					<p className="text-sm text-muted-foreground">
						Visitor insights from PostHog
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Select
						value={dateRange}
						onValueChange={(v) => setDateRange(v as DateRange)}
					>
						<SelectTrigger className="w-[120px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="7d">Last 7 days</SelectItem>
							<SelectItem value="30d">Last 30 days</SelectItem>
							<SelectItem value="90d">Last 90 days</SelectItem>
						</SelectContent>
					</Select>
					<Button
						onClick={refresh}
						variant="outline"
						size="icon"
						className="h-9 w-9"
						disabled={loading}
					>
						{loading ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<ArrowUpRight className="h-4 w-4" />
						)}
					</Button>
				</div>
			</div>

			{/* Summary cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<Card className="p-4">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<TrendingUp className="h-4 w-4" />
						Total Pageviews
					</div>
					<div className="mt-1 text-2xl font-bold">
						{formatNumber(data.totalPageviews)}
					</div>
				</Card>
				<Card className="p-4">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Users className="h-4 w-4" />
						Unique Visitors
					</div>
					<div className="mt-1 text-2xl font-bold">
						{formatNumber(data.totalVisitors)}
					</div>
				</Card>
				<Card className="p-4">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<BarChart3 className="h-4 w-4" />
						Avg / Day
					</div>
					<div className="mt-1 text-2xl font-bold">
						{formatNumber(Math.round(data.avgPageviewsPerDay))}
					</div>
				</Card>
			</div>

			{/* Pageviews chart */}
			<PageviewsChart pageviews={data.pageviews} dateRange={dateRange} />

			{/* Two-column grid: Top Pages + Referral Sources */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{/* Top Pages */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-semibold">Top Pages</CardTitle>
					</CardHeader>
					<CardContent>
						{data.topPages.length === 0 ? (
							<p className="text-sm text-muted-foreground">No data yet</p>
						) : (
							<div className="space-y-2">
								{data.topPages.slice(0, 10).map((page, i) => (
									<div
										key={page.path}
										className="flex items-center justify-between gap-2 text-sm"
									>
										<div className="flex items-center gap-2 min-w-0">
											<span className="shrink-0 text-xs text-muted-foreground w-5 text-right">
												{i + 1}.
											</span>
											<span
												className="truncate font-mono text-xs"
												title={page.path}
											>
												{page.path}
											</span>
										</div>
										<span className="shrink-0 tabular-nums text-muted-foreground">
											{formatNumber(page.count)}
										</span>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Referral Sources */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-semibold">
							Referral Sources
						</CardTitle>
					</CardHeader>
					<CardContent>
						{data.referralSources.length === 0 ? (
							<p className="text-sm text-muted-foreground">No data yet</p>
						) : (
							<div className="space-y-2">
								{data.referralSources.slice(0, 10).map((ref, i) => (
									<div
										key={ref.source}
										className="flex items-center justify-between gap-2 text-sm"
									>
										<div className="flex items-center gap-2 min-w-0">
											<span className="shrink-0 text-xs text-muted-foreground w-5 text-right">
												{i + 1}.
											</span>
											<span className="truncate">{ref.source}</span>
										</div>
										<span className="shrink-0 tabular-nums text-muted-foreground">
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
