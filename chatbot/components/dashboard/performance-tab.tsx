"use client";

import {
	AlertCircle,
	CheckCircle2,
	ExternalLink,
	FlaskConical,
	Loader2,
	Search,
	Users,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	usePerformance,
	type FieldMetric,
	type LabMetric,
	type MergedMetric,
	type MetricRating,
} from "@/hooks/use-performance";

// ── Helpers ──────────────────────────────────────────────────────────────────

const RATING_STYLES: Record<
	MetricRating,
	{ color: string; bg: string; label: string }
> = {
	good: { color: "text-green-700", bg: "bg-green-100", label: "Good" },
	needs_improvement: {
		color: "text-orange-700",
		bg: "bg-orange-100",
		label: "Needs work",
	},
	poor: { color: "text-red-700", bg: "bg-red-100", label: "Poor" },
	unknown: {
		color: "text-muted-foreground",
		bg: "bg-muted",
		label: "No data",
	},
};

function RatingBadge({ rating }: { rating: MetricRating }) {
	const s = RATING_STYLES[rating];
	const Icon =
		rating === "good"
			? CheckCircle2
			: rating === "poor"
				? XCircle
				: AlertCircle;
	return (
		<span
			className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.bg} ${s.color}`}
		>
			<Icon className="h-3 w-3" />
			{s.label}
		</span>
	);
}

function formatValue(value: number | null, unit: string): string {
	if (value === null) return "—";
	if (unit === "ms") {
		return value >= 1000
			? `${(value / 1000).toFixed(1)}s`
			: `${Math.round(value)}ms`;
	}
	if (unit === "score") return value.toFixed(3);
	return String(value);
}

// ── MetricCard ────────────────────────────────────────────────────────────────

function MetricCard({ metric }: { metric: MergedMetric }) {
	const { label, unit, isCoreCWV, field, lab } = metric;

	return (
		<Card className={isCoreCWV ? "ring-1 ring-border" : ""}>
			<CardHeader className="pb-2 pt-4">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-semibold">{label}</CardTitle>
					{isCoreCWV && (
						<span className="text-[10px] font-medium text-muted-foreground">
							Core Web Vital
						</span>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-3 pb-4">
				{/* Field data — CrUX */}
				<div className="space-y-1.5">
					<div className="flex items-center justify-between">
						<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
							<Users className="h-3 w-3" />
							Real users
						</span>
						{field ? (
							<RatingBadge rating={field.rating as MetricRating} />
						) : (
							<span className="text-xs text-muted-foreground">No data</span>
						)}
					</div>
					<p className="text-xl font-bold">
						{field ? formatValue(field.p75, unit) : "—"}
					</p>
					{field?.histogram && (
						<div className="space-y-1">
							<div className="flex h-1.5 overflow-hidden rounded-full">
								<div
									className="bg-green-500"
									style={{ width: `${field.histogram[0]}%` }}
								/>
								<div
									className="bg-orange-400"
									style={{ width: `${field.histogram[1]}%` }}
								/>
								<div
									className="bg-red-500"
									style={{ width: `${field.histogram[2]}%` }}
								/>
							</div>
							<div className="flex justify-between text-[10px] text-muted-foreground">
								<span>{field.histogram[0]}% good</span>
								<span>{field.histogram[1]}% ok</span>
								<span>{field.histogram[2]}% poor</span>
							</div>
						</div>
					)}
				</div>

				{/* Separator */}
				<div className="border-t" />

				{/* Lab data — PSI */}
				<div className="space-y-1">
					<div className="flex items-center justify-between">
						<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
							<FlaskConical className="h-3 w-3" />
							Lab (PSI)
						</span>
						{lab ? (
							<RatingBadge rating={lab.rating as MetricRating} />
						) : (
							<span className="text-xs text-muted-foreground">No data</span>
						)}
					</div>
					<p className="text-base font-semibold text-muted-foreground">
						{lab ? formatValue(lab.value, unit) : "—"}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

// ── Main tab ──────────────────────────────────────────────────────────────────

const CWV_KEYS = [
	"largest_contentful_paint",
	"cumulative_layout_shift",
	"interaction_to_next_paint",
];
const SUPPORTING_KEYS = [
	"first_contentful_paint",
	"experimental_time_to_first_byte",
];

export function PerformanceTab({ projectUrl }: { projectUrl?: string }) {
	const { data, loading, error, analyze } = usePerformance(projectUrl);
	const [inputValue, setInputValue] = useState(projectUrl ?? "");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (inputValue.trim()) analyze(inputValue.trim());
	};

	return (
		<div className="space-y-6">
			{/* URL form */}
			<form onSubmit={handleSubmit} className="flex gap-2">
				<Input
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					placeholder="https://example.com"
					className="font-mono text-sm"
				/>
				<Button type="submit" disabled={loading || !inputValue.trim()}>
					{loading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Search className="h-4 w-4" />
					)}
					<span className="ml-2 hidden sm:inline">Analyze</span>
				</Button>
			</form>

			{error && (
				<div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
					<AlertCircle className="h-4 w-4 shrink-0" />
					{error}
				</div>
			)}

			{data && (
				<div className="space-y-6">
					{/* Summary bar */}
					<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
						<div className="flex flex-wrap items-center gap-3 text-sm">
							{data.hasFieldData ? (
								<span className="flex items-center gap-1.5 font-medium">
									<Users className="h-4 w-4 text-blue-500" />
									Real user data · 28-day p75
								</span>
							) : (
								<span className="flex items-center gap-1.5 text-muted-foreground">
									<Users className="h-4 w-4" />
									No field data — low traffic or new site
								</span>
							)}
							{data.performanceScore !== null && (
								<span className="flex items-center gap-1.5 text-muted-foreground">
									<FlaskConical className="h-4 w-4 text-orange-500" />
									Lab score {data.performanceScore}/100
								</span>
							)}
						</div>
						<div className="flex items-center gap-2">
							{data.overallCwv && (
								<Badge
									variant="outline"
									className={
										data.overallCwv === "good"
											? "border-green-300 bg-green-50 text-green-700"
											: "border-red-300 bg-red-50 text-red-700"
									}
								>
									{data.overallCwv === "good" ? "✓ Passes CWV" : "✗ Fails CWV"}
								</Badge>
							)}
							<a
								href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(data.url)}`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
							>
								PageSpeed <ExternalLink className="h-3 w-3" />
							</a>
						</div>
					</div>

					{/* Core Web Vitals */}
					<div>
						<h3 className="mb-3 text-sm font-semibold">Core Web Vitals</h3>
						<div className="grid gap-4 sm:grid-cols-3">
							{CWV_KEYS.map((key) => {
								const metric = data.metrics[key];
								return metric ? (
									<MetricCard key={key} metric={metric} />
								) : null;
							})}
						</div>
					</div>

					{/* Supporting metrics */}
					<div>
						<h3 className="mb-3 text-sm font-semibold">Supporting Metrics</h3>
						<div className="grid gap-4 sm:grid-cols-2">
							{SUPPORTING_KEYS.map((key) => {
								const metric = data.metrics[key];
								return metric ? (
									<MetricCard key={key} metric={metric} />
								) : null;
							})}
						</div>
					</div>
				</div>
			)}

			{!data && !loading && !error && (
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
					<Search className="mb-3 h-8 w-8 text-muted-foreground" />
					<p className="font-medium">Enter a URL to analyze</p>
					<p className="mt-1 text-sm text-muted-foreground">
						Real user data (CrUX) + Lab simulation (PSI) · Side by side
					</p>
				</div>
			)}
		</div>
	);
}
