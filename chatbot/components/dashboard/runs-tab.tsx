"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRobotRuns, type RobotRun } from "@/hooks/use-robot-runs";
import {
	AlertCircle,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Clock,
	Loader2,
	RefreshCw,
	Zap,
} from "lucide-react";
import { useState } from "react";

function formatDuration(ms: number | null): string {
	if (ms === null) return "—";
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
	return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
}

function formatRelative(iso: string | null): string {
	if (!iso) return "—";
	const diff = Date.now() - new Date(iso).getTime();
	if (diff < 60_000) return "just now";
	if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
	if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
	return `${Math.floor(diff / 86_400_000)}d ago`;
}

function StatusBadge({ status }: { status: RobotRun["status"] }) {
	if (status === "success") {
		return (
			<Badge variant="outline" className="gap-1 border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
				<CheckCircle2 className="h-3 w-3" />
				success
			</Badge>
		);
	}
	if (status === "error") {
		return (
			<Badge variant="outline" className="gap-1 border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
				<AlertCircle className="h-3 w-3" />
				error
			</Badge>
		);
	}
	return (
		<Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400">
			<Loader2 className="h-3 w-3 animate-spin" />
			running
		</Badge>
	);
}

function RunRow({ run }: { run: RobotRun }) {
	const [expanded, setExpanded] = useState(false);
	const hasDetails = run.outputs_summary_json || run.error || run.inputs_json;

	return (
		<div className="border-b last:border-0">
			<div
				className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-default"
				onClick={() => hasDetails && setExpanded((v) => !v)}
				role={hasDetails ? "button" : undefined}
			>
				{/* Robot + workflow */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 flex-wrap">
						<Badge variant="secondary" className="font-mono text-xs">
							{run.robot_name}
						</Badge>
						<span className="text-sm text-muted-foreground truncate">{run.workflow_type}</span>
					</div>
				</div>

				{/* Status */}
				<StatusBadge status={run.status} />

				{/* Duration */}
				<div className="flex items-center gap-1 text-xs text-muted-foreground w-16 justify-end">
					<Clock className="h-3 w-3 shrink-0" />
					{formatDuration(run.duration_ms)}
				</div>

				{/* Date */}
				<span className="text-xs text-muted-foreground w-20 text-right shrink-0">
					{formatRelative(run.started_at)}
				</span>

				{/* Expand toggle */}
				{hasDetails && (
					<span className="text-muted-foreground">
						{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
					</span>
				)}
			</div>

			{/* Expanded details */}
			{expanded && hasDetails && (
				<div className="px-4 pb-3 space-y-2 bg-muted/20">
					{run.error && (
						<div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400 font-mono">
							{run.error}
						</div>
					)}
					{run.outputs_summary_json && (
						<div>
							<p className="text-xs font-medium text-muted-foreground mb-1">Outputs</p>
							<pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-40">
								{JSON.stringify(run.outputs_summary_json, null, 2)}
							</pre>
						</div>
					)}
					{run.inputs_json && (
						<div>
							<p className="text-xs font-medium text-muted-foreground mb-1">Inputs</p>
							<pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-24">
								{JSON.stringify(run.inputs_json, null, 2)}
							</pre>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

const ROBOT_FILTERS = ["all", "scheduler", "site_health_monitor", "tech_stack_analyzer", "seo"];
const STATUS_FILTERS: Array<{ value: string; label: string }> = [
	{ value: "all", label: "All" },
	{ value: "success", label: "Success" },
	{ value: "error", label: "Error" },
	{ value: "running", label: "Running" },
];

export function RunsTab() {
	const [robotFilter, setRobotFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");

	const { runs, loading, error, stats, refresh } = useRobotRuns({
		robotName: robotFilter !== "all" ? robotFilter : undefined,
		status: statusFilter !== "all" ? (statusFilter as RobotRun["status"]) : undefined,
		limit: 50,
	});

	return (
		<div className="space-y-4">
			{/* Stats row */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				{loading
					? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
					: stats.slice(0, 4).map((s) => (
							<Card key={s.robotName} className="p-3">
								<div className="flex items-center gap-1.5 mb-1">
									<Zap className="h-3.5 w-3.5 text-muted-foreground" />
									<span className="text-xs font-medium text-muted-foreground truncate">{s.robotName}</span>
								</div>
								<p className="text-xl font-bold">{s.totalRuns}</p>
								<p className="text-xs text-muted-foreground">{s.successRate}% success</p>
							</Card>
						))}
			</div>

			{/* Filters + refresh */}
			<div className="flex items-center gap-2 flex-wrap">
				{/* Robot filter */}
				<div className="flex gap-1 flex-wrap">
					{ROBOT_FILTERS.map((r) => (
						<Button
							key={r}
							variant={robotFilter === r ? "secondary" : "ghost"}
							size="sm"
							className="h-7 text-xs"
							onClick={() => setRobotFilter(r)}
						>
							{r === "all" ? "All robots" : r}
						</Button>
					))}
				</div>

				<div className="h-5 w-px bg-border hidden sm:block" />

				{/* Status filter */}
				<div className="flex gap-1">
					{STATUS_FILTERS.map((s) => (
						<Button
							key={s.value}
							variant={statusFilter === s.value ? "secondary" : "ghost"}
							size="sm"
							className="h-7 text-xs"
							onClick={() => setStatusFilter(s.value)}
						>
							{s.label}
						</Button>
					))}
				</div>

				<div className="ml-auto">
					<Button variant="ghost" size="sm" className="h-7 gap-1.5" onClick={refresh}>
						<RefreshCw className="h-3.5 w-3.5" />
						Refresh
					</Button>
				</div>
			</div>

			{/* List */}
			<Card>
				<CardHeader className="pb-2 pt-4 px-4">
					<CardTitle className="text-sm">
						{runs.length} run{runs.length !== 1 ? "s" : ""}
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{loading ? (
						<div className="p-4 space-y-2">
							{Array.from({ length: 5 }).map((_, i) => (
								<Skeleton key={i} className="h-10 w-full" />
							))}
						</div>
					) : error ? (
						<div className="flex items-center gap-2 p-4 text-sm text-red-600">
							<AlertCircle className="h-4 w-4" />
							{error}
						</div>
					) : runs.length === 0 ? (
						<div className="p-8 text-center text-sm text-muted-foreground">
							No runs recorded yet. Trigger a workflow to see data here.
						</div>
					) : (
						<div>
							{runs.map((run) => (
								<RunRow key={run.run_id} run={run} />
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
