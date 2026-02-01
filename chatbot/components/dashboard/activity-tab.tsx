"use client";

import {
	AlertCircle,
	Bot,
	CheckCircle,
	ChevronDown,
	ChevronRight,
	Clock,
	Loader2,
	Play,
	RefreshCw,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { type ActivityLog, useActivity } from "@/hooks/use-activity";

function getStatusIcon(status: ActivityLog["status"]) {
	switch (status) {
		case "started":
			return <Play className="h-4 w-4 text-blue-500" />;
		case "running":
			return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
		case "completed":
			return <CheckCircle className="h-4 w-4 text-green-500" />;
		case "failed":
			return <XCircle className="h-4 w-4 text-red-500" />;
		default:
			return <Clock className="h-4 w-4 text-muted-foreground" />;
	}
}

function getStatusBadge(status: ActivityLog["status"]) {
	switch (status) {
		case "started":
			return <Badge className="bg-blue-100 text-blue-800">Started</Badge>;
		case "running":
			return <Badge className="bg-blue-100 text-blue-800">Running</Badge>;
		case "completed":
			return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
		case "failed":
			return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
		default:
			return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
	}
}

function getRobotName(robotId?: string) {
	switch (robotId) {
		case "seo":
			return "SEO Robot";
		case "newsletter":
			return "Newsletter Robot";
		case "articles":
			return "Article Generator";
		case "scheduler":
			return "Scheduler Robot";
		default:
			return robotId || "System";
	}
}

function formatDuration(ms?: number) {
	if (!ms) return "-";
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
	return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function formatTime(date: Date | string) {
	const d = new Date(date);
	return d.toLocaleString();
}

interface ActivityLogCardProps {
	log: ActivityLog;
}

function ActivityLogCard({ log }: ActivityLogCardProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<Card className="p-4">
			<Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
				<div className="flex items-start justify-between">
					<div className="flex items-start gap-3">
						{getStatusIcon(log.status)}
						<div>
							<div className="flex items-center gap-2">
								<span className="font-medium">{log.action}</span>
								{getStatusBadge(log.status)}
							</div>
							<div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
								<span className="flex items-center gap-1">
									<Bot className="h-3 w-3" />
									{getRobotName(log.robotId)}
								</span>
								<span className="flex items-center gap-1">
									<Clock className="h-3 w-3" />
									{formatTime(log.createdAt)}
								</span>
								{log.details?.duration && (
									<span>Duration: {formatDuration(log.details.duration)}</span>
								)}
							</div>
						</div>
					</div>

					<CollapsibleTrigger asChild>
						<Button variant="ghost" size="sm">
							{isExpanded ? (
								<ChevronDown className="h-4 w-4" />
							) : (
								<ChevronRight className="h-4 w-4" />
							)}
						</Button>
					</CollapsibleTrigger>
				</div>

				<CollapsibleContent>
					<div className="mt-4 pt-4 border-t space-y-3">
						{log.details?.input && (
							<div>
								<p className="text-xs font-medium text-muted-foreground mb-1">
									Input
								</p>
								<pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
									{JSON.stringify(log.details.input, null, 2)}
								</pre>
							</div>
						)}
						{log.details?.output && (
							<div>
								<p className="text-xs font-medium text-muted-foreground mb-1">
									Output
								</p>
								<pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-48 overflow-y-auto">
									{JSON.stringify(log.details.output, null, 2)}
								</pre>
							</div>
						)}
						{log.details?.error && (
							<div>
								<p className="text-xs font-medium text-red-600 mb-1">Error</p>
								<pre className="text-xs bg-red-50 text-red-600 p-2 rounded">
									{log.details.error}
								</pre>
							</div>
						)}
						{log.completedAt && (
							<p className="text-xs text-muted-foreground">
								Completed: {formatTime(log.completedAt)}
							</p>
						)}
					</div>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}

interface ActivityTabProps {
	projectId?: string;
}

export function ActivityTab({ projectId }: ActivityTabProps) {
	const [robotFilter, setRobotFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	const { logs, loading, stats, refresh } = useActivity({
		projectId,
		robotId: robotFilter !== "all" ? robotFilter : undefined,
		status: statusFilter !== "all" ? (statusFilter as ActivityLog["status"]) : undefined,
		autoRefresh: true,
		refreshInterval: 15000,
	});

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-xl font-semibold">Activity Log</h2>
					<p className="text-sm text-muted-foreground">
						Track all robot actions and analyses
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
					<Select value={robotFilter} onValueChange={setRobotFilter}>
						<SelectTrigger className="w-full sm:w-[150px]">
							<SelectValue placeholder="Robot" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Robots</SelectItem>
							<SelectItem value="seo">SEO Robot</SelectItem>
							<SelectItem value="newsletter">Newsletter</SelectItem>
							<SelectItem value="articles">Articles</SelectItem>
							<SelectItem value="scheduler">Scheduler</SelectItem>
						</SelectContent>
					</Select>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-full sm:w-[130px]">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value="running">Running</SelectItem>
							<SelectItem value="completed">Completed</SelectItem>
							<SelectItem value="failed">Failed</SelectItem>
						</SelectContent>
					</Select>
					<Button onClick={refresh} variant="outline" size="sm" className="w-full sm:w-auto">
						<RefreshCw className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
				<Card className="p-4">
					<div className="text-2xl font-bold">{stats.total}</div>
					<div className="text-sm text-muted-foreground">Total Actions</div>
				</Card>
				<Card className="p-4">
					<div className="text-2xl font-bold text-blue-600">{stats.running}</div>
					<div className="text-sm text-muted-foreground">Running</div>
				</Card>
				<Card className="p-4">
					<div className="text-2xl font-bold text-green-600">{stats.completed}</div>
					<div className="text-sm text-muted-foreground">Completed</div>
				</Card>
				<Card className="p-4">
					<div className="text-2xl font-bold text-red-600">{stats.failed}</div>
					<div className="text-sm text-muted-foreground">Failed</div>
				</Card>
			</div>

			{/* Activity List */}
			{loading ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					<span className="ml-3 text-muted-foreground">Loading activity...</span>
				</div>
			) : logs.length === 0 ? (
				<Card className="p-8 text-center">
					<AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
					<h3 className="text-lg font-semibold">No Activity Yet</h3>
					<p className="text-sm text-muted-foreground mt-1">
						Run a robot or analysis to see activity here.
					</p>
				</Card>
			) : (
				<div className="space-y-3">
					{logs.map((log) => (
						<ActivityLogCard key={log.id} log={log} />
					))}
				</div>
			)}
		</div>
	);
}
