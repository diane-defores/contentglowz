"use client";

import {
	Bot,
	ChevronDown,
	ChevronRight,
	Loader2,
	Pause,
	Play,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Robot } from "@/hooks/use-robots";

function getStatusColor(status: string) {
	switch (status) {
		case "operational":
		case "idle":
			return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
		case "running":
			return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
		case "error":
			return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
		case "disabled":
			return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
		default:
			return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
	}
}

function getStatusDot(status: string) {
	switch (status) {
		case "operational":
		case "idle":
			return "bg-green-500";
		case "running":
			return "bg-blue-500 animate-pulse";
		case "error":
			return "bg-red-500";
		case "disabled":
			return "bg-gray-400";
		default:
			return "bg-gray-400";
	}
}

function getAgentStatusDot(status: string) {
	switch (status) {
		case "idle":
			return "bg-green-500";
		case "running":
			return "bg-blue-500 animate-pulse";
		case "error":
			return "bg-red-500";
		case "disabled":
			return "bg-gray-400";
		default:
			return "bg-gray-400";
	}
}

interface RobotCardCompactProps {
	robot: Robot;
	isRunning: boolean;
	onRun: () => void;
	onStop: () => void;
	onboardingHighlight?: "category" | "robot" | "run-button";
}

export function RobotCardCompact({
	robot,
	isRunning,
	onRun,
	onStop,
	onboardingHighlight,
}: RobotCardCompactProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div className="rounded-lg border bg-card p-3 sm:p-4">
			<Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
						<div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg shrink-0">
							<Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
						</div>
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2 flex-wrap">
								<h4 className="font-medium text-sm sm:text-base truncate">
									{robot.name}
								</h4>
								<Badge
									className={`${getStatusColor(robot.status)} text-xs shrink-0`}
								>
									<span
										className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDot(robot.status)}`}
									/>
									{robot.status === "operational" ? "idle" : robot.status}
								</Badge>
							</div>
							{/* Agent status indicators */}
							<TooltipProvider delayDuration={300}>
								<div className="flex items-center gap-1 mt-1.5">
									{robot.agents.slice(0, 6).map((agent) => (
										<Tooltip key={agent.name}>
											<TooltipTrigger asChild>
												<div
													className={`w-2 h-2 rounded-full ${getAgentStatusDot(agent.status)} cursor-help`}
												/>
											</TooltipTrigger>
											<TooltipContent side="bottom" className="text-xs">
												<p className="font-medium">{agent.name}</p>
												<p className="text-muted-foreground">
													{agent.description}
												</p>
											</TooltipContent>
										</Tooltip>
									))}
									{robot.agents.length > 6 && (
										<span className="text-xs text-muted-foreground ml-1">
											+{robot.agents.length - 6}
										</span>
									)}
								</div>
							</TooltipProvider>
						</div>
					</div>

					<div className="flex items-center gap-1 sm:gap-2 shrink-0">
						{robot.status === "running" || isRunning ? (
							<Button
								onClick={onStop}
								variant="destructive"
								size="sm"
								className="h-8 px-2 sm:px-3"
							>
								<Pause className="h-3.5 w-3.5 sm:mr-1.5" />
								<span className="hidden sm:inline">Stop</span>
							</Button>
						) : (
							<Button
								onClick={onRun}
								size="sm"
								disabled={isRunning || robot.status === "disabled"}
								className="h-8 px-2 sm:px-3"
							>
								{isRunning ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin sm:mr-1.5" />
								) : (
									<Play className="h-3.5 w-3.5 sm:mr-1.5" />
								)}
								<span className="hidden sm:inline">Run</span>
							</Button>
						)}

						<CollapsibleTrigger asChild>
							<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
								{isExpanded ? (
									<ChevronDown className="h-4 w-4" />
								) : (
									<ChevronRight className="h-4 w-4" />
								)}
							</Button>
						</CollapsibleTrigger>
					</div>
				</div>

				<CollapsibleContent>
					<div className="mt-3 pt-3 border-t">
						<p className="text-xs sm:text-sm text-muted-foreground mb-3">
							{robot.description}
						</p>
						<div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
							{robot.agents.map((agent) => (
								<div
									key={agent.name}
									className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs sm:text-sm"
								>
									<span
										className={`w-2 h-2 rounded-full shrink-0 ${getAgentStatusDot(agent.status)}`}
									/>
									<span className="truncate">{agent.name}</span>
								</div>
							))}
						</div>
						{robot.lastRun && (
							<p className="text-xs text-muted-foreground mt-2">
								Last run: {new Date(robot.lastRun).toLocaleString()}
							</p>
						)}
					</div>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}
