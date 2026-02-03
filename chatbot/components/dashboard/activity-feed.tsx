"use client";

import {
	AlertCircle,
	Bot,
	CheckCircle,
	ChevronRight,
	Clock,
	Loader2,
	Play,
	XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActivityLog } from "@/hooks/use-activity";

function getStatusIcon(status: ActivityLog["status"]) {
	const iconClass = "h-3.5 w-3.5 shrink-0";
	switch (status) {
		case "started":
			return <Play className={`${iconClass} text-blue-500`} />;
		case "running":
			return <Loader2 className={`${iconClass} text-blue-500 animate-spin`} />;
		case "completed":
			return <CheckCircle className={`${iconClass} text-green-500`} />;
		case "failed":
			return <XCircle className={`${iconClass} text-red-500`} />;
		default:
			return <Clock className={`${iconClass} text-muted-foreground`} />;
	}
}

function getRobotName(robotId?: string) {
	switch (robotId) {
		case "seo":
			return "SEO";
		case "newsletter":
			return "Newsletter";
		case "articles":
			return "Articles";
		case "scheduler":
			return "Scheduler";
		case "images":
			return "Images";
		default:
			return robotId || "System";
	}
}

function formatRelativeTime(date: Date | string) {
	const d = new Date(date);
	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffMin = Math.floor(diffMs / 60000);
	const diffHour = Math.floor(diffMs / 3600000);

	if (diffMin < 1) return "now";
	if (diffMin < 60) return `${diffMin}m ago`;
	if (diffHour < 24) return `${diffHour}h ago`;
	return d.toLocaleDateString();
}

function formatTime(date: Date | string) {
	const d = new Date(date);
	return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface ActivityFeedProps {
	logs: ActivityLog[];
	loading?: boolean;
	limit?: number;
	onViewAll?: () => void;
}

export function ActivityFeed({
	logs,
	loading,
	limit = 5,
	onViewAll,
}: ActivityFeedProps) {
	const displayLogs = logs.slice(0, limit);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-6">
				<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (displayLogs.length === 0) {
		return (
			<div className="text-center py-6">
				<AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
				<p className="text-sm text-muted-foreground">No recent activity</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{displayLogs.map((log) => (
				<div
					key={log.id}
					className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
				>
					{getStatusIcon(log.status)}
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 text-xs sm:text-sm">
							<span className="text-muted-foreground">
								{formatTime(log.createdAt)}
							</span>
							<span className="text-muted-foreground">-</span>
							<span className="font-medium truncate">{log.action}</span>
						</div>
						<div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
							<Bot className="h-3 w-3" />
							<span>{getRobotName(log.robotId)}</span>
							{log.details?.duration && (
								<>
									<span className="mx-1">·</span>
									<span>{Math.round(log.details.duration / 1000)}s</span>
								</>
							)}
						</div>
					</div>
					<span className="text-xs text-muted-foreground shrink-0">
						{formatRelativeTime(log.createdAt)}
					</span>
				</div>
			))}

			{onViewAll && logs.length > limit && (
				<Button
					variant="ghost"
					size="sm"
					onClick={onViewAll}
					className="w-full mt-2 text-xs"
				>
					View all activity
					<ChevronRight className="h-3.5 w-3.5 ml-1" />
				</Button>
			)}
		</div>
	);
}
