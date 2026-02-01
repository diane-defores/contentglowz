"use client";

import {
	AlertCircle,
	Bot,
	ChevronDown,
	ChevronRight,
	Loader2,
	Pause,
	Play,
	RefreshCw,
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
import { useRobots, type Robot } from "@/hooks/use-robots";

function getStatusColor(status: string) {
	switch (status) {
		case "operational":
		case "idle":
			return "bg-green-100 text-green-800";
		case "running":
			return "bg-blue-100 text-blue-800";
		case "error":
			return "bg-red-100 text-red-800";
		case "disabled":
			return "bg-gray-100 text-gray-800";
		default:
			return "bg-gray-100 text-gray-800";
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

interface RobotCardProps {
	robot: Robot;
	isRunning: boolean;
	onTrigger: () => void;
	onStop: () => void;
}

function RobotCard({ robot, isRunning, onTrigger, onStop }: RobotCardProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<Card className="p-0 overflow-hidden">
			<Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
				<div className="p-6">
					<div className="flex items-start justify-between">
						<div className="flex items-start gap-4">
							<div className="p-3 bg-primary/10 rounded-lg">
								<Bot className="h-6 w-6 text-primary" />
							</div>
							<div>
								<div className="flex items-center gap-3">
									<h3 className="font-semibold text-lg">{robot.name}</h3>
									<Badge className={getStatusColor(robot.status)}>
										<span
											className={`w-2 h-2 rounded-full mr-2 ${getStatusDot(robot.status)}`}
										/>
										{robot.status}
									</Badge>
								</div>
								<p className="text-sm text-muted-foreground mt-1">
									{robot.description}
								</p>
								<div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
									<span>{robot.agents.length} agents</span>
									{robot.lastRun && (
										<span>
											Last run: {new Date(robot.lastRun).toLocaleString()}
										</span>
									)}
									{robot.metrics && (
										<span>
											{robot.metrics.totalRuns} runs ({robot.metrics.successRate}% success)
										</span>
									)}
								</div>
							</div>
						</div>

						<div className="flex items-center gap-2">
							{robot.status === "running" || isRunning ? (
								<Button
									onClick={onStop}
									variant="destructive"
									size="sm"
									disabled={!isRunning}
								>
									<Pause className="mr-2 h-4 w-4" />
									Stop
								</Button>
							) : (
								<Button
									onClick={onTrigger}
									size="sm"
									disabled={isRunning || robot.status === "disabled"}
								>
									{isRunning ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<Play className="mr-2 h-4 w-4" />
									)}
									Run
								</Button>
							)}

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
					</div>
				</div>

				<CollapsibleContent>
					<div className="border-t bg-muted/50 p-6">
						<h4 className="font-medium mb-4">Agents</h4>
						<div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
							{robot.agents.map((agent) => (
								<div
									key={agent.name}
									className="flex items-center gap-3 p-3 bg-background rounded-lg border"
								>
									<span
										className={`w-2 h-2 rounded-full ${getStatusDot(agent.status)}`}
									/>
									<div className="flex-1 min-w-0">
										<p className="font-medium text-sm truncate">{agent.name}</p>
										<p className="text-xs text-muted-foreground truncate">
											{agent.description}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}

export function RobotsTab() {
	const {
		robots,
		loading,
		runningRobot,
		error,
		refresh,
		triggerRobot,
		stopRobot,
		clearError,
	} = useRobots();

	const operationalCount = robots.filter(
		(r) => r.status === "operational",
	).length;
	const runningCount = robots.filter((r) => r.status === "running").length;
	const errorCount = robots.filter((r) => r.status === "error").length;

	if (loading && robots.every((r) => r.status === "operational")) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<span className="ml-3 text-muted-foreground">Loading robots...</span>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Error Banner */}
			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-4">
					<div className="flex items-center gap-3">
						<AlertCircle className="h-5 w-5 text-red-500" />
						<div className="flex-1">
							<p className="text-sm text-red-600">{error}</p>
						</div>
						<Button onClick={clearError} variant="ghost" size="sm">
							Dismiss
						</Button>
					</div>
				</div>
			)}

			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-xl font-semibold">Robots</h2>
					<p className="text-sm text-muted-foreground">
						Manage and monitor your AI automation robots
					</p>
				</div>
				<Button onClick={refresh} variant="outline" size="sm">
					<RefreshCw className="mr-2 h-4 w-4" />
					Refresh Status
				</Button>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
				<Card className="p-4">
					<div className="text-2xl font-bold">{robots.length}</div>
					<div className="text-sm text-muted-foreground">Total Robots</div>
				</Card>
				<Card className="p-4">
					<div className="text-2xl font-bold text-green-600">
						{operationalCount}
					</div>
					<div className="text-sm text-muted-foreground">Operational</div>
				</Card>
				<Card className="p-4">
					<div className="text-2xl font-bold text-blue-600">{runningCount}</div>
					<div className="text-sm text-muted-foreground">Running</div>
				</Card>
				<Card className="p-4">
					<div className="text-2xl font-bold text-red-600">{errorCount}</div>
					<div className="text-sm text-muted-foreground">Errors</div>
				</Card>
			</div>

			{/* Robot Cards */}
			<div className="space-y-4">
				{robots.map((robot) => (
					<RobotCard
						key={robot.id}
						robot={robot}
						isRunning={runningRobot === robot.id}
						onTrigger={() => triggerRobot(robot.id)}
						onStop={() => stopRobot(robot.id)}
					/>
				))}
			</div>
		</div>
	);
}
