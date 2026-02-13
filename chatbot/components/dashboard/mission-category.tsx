"use client";

import {
	ChevronDown,
	ChevronRight,
	FileText,
	Loader2,
	Play,
	TrendingUp,
	Wrench,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Robot } from "@/hooks/use-robots";
import { RobotCardCompact } from "./robot-card-compact";

const iconMap = {
	TrendingUp,
	FileText,
	Wrench,
};

const colorMap = {
	blue: {
		bg: "bg-blue-100 dark:bg-blue-900/30",
		text: "text-blue-600 dark:text-blue-400",
		badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
	},
	purple: {
		bg: "bg-purple-100 dark:bg-purple-900/30",
		text: "text-purple-600 dark:text-purple-400",
		badge:
			"bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
	},
	orange: {
		bg: "bg-orange-100 dark:bg-orange-900/30",
		text: "text-orange-600 dark:text-orange-400",
		badge:
			"bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
	},
};

interface MissionCategoryProps {
	id: string;
	title: string;
	icon: keyof typeof iconMap;
	color: keyof typeof colorMap;
	robots: Robot[];
	runningRobot: string | null;
	onTriggerRobot: (robotId: string) => Promise<boolean>;
	onStopRobot: (robotId: string) => Promise<boolean>;
	defaultOpen?: boolean;
	onboardingHighlight?: "category" | "robot" | "run-button";
	onNavigateToTab?: (tab: string) => void;
}

export function MissionCategory({
	id,
	title,
	icon,
	color,
	robots,
	runningRobot,
	onTriggerRobot,
	onStopRobot,
	defaultOpen = false,
	onboardingHighlight,
	onNavigateToTab,
}: MissionCategoryProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const [isRunningAll, setIsRunningAll] = useState(false);

	const Icon = iconMap[icon];
	const colors = colorMap[color];

	const runningCount = robots.filter((r) => r.status === "running").length;
	const idleCount = robots.filter((r) => r.status === "operational").length;

	const handleRunAll = async () => {
		setIsRunningAll(true);
		try {
			// Run robots sequentially to avoid overwhelming the API
			for (const robot of robots) {
				// Skip newsletter robot — it needs the dedicated form
				if (robot.id === "newsletter") continue;
				if (
					robot.status !== "running" &&
					robot.status !== "disabled" &&
					runningRobot !== robot.id
				) {
					await onTriggerRobot(robot.id);
				}
			}
		} finally {
			setIsRunningAll(false);
		}
	};

	if (robots.length === 0) {
		return null;
	}

	return (
		<div className="rounded-lg border bg-card">
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="flex items-center justify-between w-full p-3 sm:p-4 hover:bg-muted/50 transition-colors rounded-t-lg"
					>
						<div className="flex items-center gap-2 sm:gap-3">
							<div className={`p-1.5 sm:p-2 rounded-lg ${colors.bg}`}>
								<Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${colors.text}`} />
							</div>
							<div className="text-left">
								<h3 className="font-semibold text-sm sm:text-base">{title}</h3>
								<div className="flex items-center gap-2 mt-0.5">
									<span className="text-xs text-muted-foreground">
										{robots.length} robot{robots.length !== 1 ? "s" : ""}
									</span>
									{runningCount > 0 && (
										<Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
											{runningCount} running
										</Badge>
									)}
									{idleCount > 0 && runningCount === 0 && (
										<Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
											{idleCount} idle
										</Badge>
									)}
								</div>
							</div>
						</div>
						<div className="flex items-center gap-2">
							{isOpen ? (
								<ChevronDown className="h-4 w-4 text-muted-foreground" />
							) : (
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
							)}
						</div>
					</button>
				</CollapsibleTrigger>

				<CollapsibleContent>
					<div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-0 space-y-3">
						{/* Run All Button */}
						{robots.length > 1 && (
							<Button
								onClick={(e) => {
									e.stopPropagation();
									handleRunAll();
								}}
								disabled={isRunningAll || runningCount === robots.length}
								variant="outline"
								size="sm"
								className="w-full"
							>
								{isRunningAll ? (
									<>
										<Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
										Running all...
									</>
								) : (
									<>
										<Play className="mr-2 h-3.5 w-3.5" />
										Run All ({robots.length})
									</>
								)}
							</Button>
						)}

						{/* Robot Cards */}
						<div className="space-y-2">
							{robots.map((robot, index) => (
								<RobotCardCompact
									key={robot.id}
									robot={robot}
									isRunning={runningRobot === robot.id}
									onRun={() => {
										if (robot.id === "newsletter" && onNavigateToTab) {
											onNavigateToTab("newsletter");
										} else {
											onTriggerRobot(robot.id);
										}
									}}
									onStop={() => onStopRobot(robot.id)}
									onboardingHighlight={
										index === 0 ? onboardingHighlight : undefined
									}
								/>
							))}
						</div>
					</div>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}
