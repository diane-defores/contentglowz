"use client";

import { useEffect, useState, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { UseSEODeploymentReturn, LogEntry } from "@/hooks/use-seo-deployment";

interface LogViewerPanelProps {
	deployment: UseSEODeploymentReturn;
}

const LEVEL_COLORS: Record<string, string> = {
	info: "text-gray-600",
	warning: "text-yellow-600",
	error: "text-red-600",
};

const LEVEL_BG: Record<string, string> = {
	info: "",
	warning: "bg-yellow-50",
	error: "bg-red-50",
};

export function LogViewerPanel({ deployment }: LogViewerPanelProps) {
	const [levelFilter, setLevelFilter] = useState<string>("all");
	const [autoScroll, setAutoScroll] = useState(true);
	const scrollRef = useRef<HTMLDivElement>(null);

	const { logs, status, fetchLogs } = deployment;

	// Auto-refresh logs when deployment is running
	useEffect(() => {
		if (!status.running) return;

		const interval = setInterval(() => {
			fetchLogs(levelFilter === "all" ? undefined : levelFilter);
		}, 2000);

		return () => clearInterval(interval);
	}, [status.running, levelFilter, fetchLogs]);

	// Initial fetch and fetch when filter changes
	useEffect(() => {
		fetchLogs(levelFilter === "all" ? undefined : levelFilter);
	}, [levelFilter, fetchLogs]);

	// Auto-scroll to bottom
	useEffect(() => {
		if (autoScroll && scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [logs, autoScroll]);

	const filteredLogs =
		levelFilter === "all"
			? logs
			: logs.filter((log) => log.level === levelFilter);

	return (
		<div className="space-y-4 pt-4">
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<Select value={levelFilter} onValueChange={setLevelFilter}>
						<SelectTrigger className="w-32">
							<SelectValue placeholder="Filter level" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Levels</SelectItem>
							<SelectItem value="info">Info</SelectItem>
							<SelectItem value="warning">Warning</SelectItem>
							<SelectItem value="error">Error</SelectItem>
						</SelectContent>
					</Select>

					<div className="flex items-center gap-2">
						<Switch
							id="auto-scroll"
							checked={autoScroll}
							onCheckedChange={setAutoScroll}
						/>
						<Label htmlFor="auto-scroll" className="text-sm">
							Auto-scroll
						</Label>
					</div>
				</div>

				<Button
					variant="outline"
					size="sm"
					onClick={() =>
						fetchLogs(levelFilter === "all" ? undefined : levelFilter)
					}
				>
					<RefreshCw className="mr-2 h-4 w-4" />
					Refresh
				</Button>
			</div>

			<ScrollArea className="h-80 rounded-lg border" ref={scrollRef}>
				<div className="p-4 space-y-1 font-mono text-xs">
					{filteredLogs.length === 0 ? (
						<p className="text-muted-foreground text-center py-8">
							No logs available
						</p>
					) : (
						filteredLogs.map((log, index) => (
							<LogLine key={`${log.timestamp}-${index}`} log={log} />
						))
					)}
				</div>
			</ScrollArea>

			<div className="flex items-center justify-between text-xs text-muted-foreground">
				<span>
					{filteredLogs.length} log{filteredLogs.length !== 1 ? "s" : ""}
				</span>
				{status.running && (
					<span className="flex items-center gap-1">
						<span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
						Live
					</span>
				)}
			</div>
		</div>
	);
}

function LogLine({ log }: { log: LogEntry }) {
	const timestamp = new Date(log.timestamp).toLocaleTimeString();

	return (
		<div className={`py-0.5 px-1 rounded ${LEVEL_BG[log.level] || ""}`}>
			<span className="text-muted-foreground">{timestamp}</span>
			<span className={`ml-2 uppercase ${LEVEL_COLORS[log.level] || ""}`}>
				[{log.level}]
			</span>
			{log.step && (
				<span className="ml-2 text-blue-600">[{log.step}]</span>
			)}
			<span className="ml-2">{log.message}</span>
		</div>
	);
}
