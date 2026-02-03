"use client";

import { useMemo } from "react";
import { useRobots, type Robot } from "./use-robots";
import { useActivity, type ActivityLog } from "./use-activity";

export interface MissionCategory {
	id: string;
	name: string;
	icon: string;
	color: string;
	robots: Robot[];
}

export interface MissionControlData {
	categories: MissionCategory[];
	activity: {
		logs: ActivityLog[];
		loading: boolean;
		stats: {
			total: number;
			running: number;
			completed: number;
			failed: number;
		};
		refresh: () => void;
	};
	robots: {
		all: Robot[];
		loading: boolean;
		runningRobot: string | null;
		error: string | null;
		refresh: () => void;
		triggerRobot: (robotId: string, action?: string) => Promise<boolean>;
		stopRobot: (robotId: string) => Promise<boolean>;
		clearError: () => void;
	};
	stats: {
		totalRobots: number;
		activeRobots: number;
		successRate: number;
		errorCount: number;
	};
}

export function useMissionControl(projectId?: string): MissionControlData {
	const robotsHook = useRobots();
	const activityHook = useActivity({
		projectId,
		limit: 5,
		autoRefresh: true,
		refreshInterval: 15000,
	});

	const categories = useMemo<MissionCategory[]>(() => {
		const { robots } = robotsHook;

		return [
			{
				id: "growth",
				name: "Croissance",
				icon: "TrendingUp",
				color: "blue",
				robots: robots.filter((r) => r.id === "seo"),
			},
			{
				id: "content",
				name: "Contenu",
				icon: "FileText",
				color: "purple",
				robots: robots.filter((r) =>
					["newsletter", "articles", "images"].includes(r.id)
				),
			},
			{
				id: "technical",
				name: "Technique",
				icon: "Wrench",
				color: "orange",
				robots: robots.filter((r) => r.id === "scheduler"),
			},
		];
	}, [robotsHook.robots]);

	const stats = useMemo(() => {
		const { robots } = robotsHook;
		const totalRobots = robots.length;
		const activeRobots = robots.filter(
			(r) => r.status === "running"
		).length;
		const errorCount = robots.filter((r) => r.status === "error").length;

		// Calculate overall success rate from robot metrics
		const totalRuns = robots.reduce(
			(sum, r) => sum + (r.metrics?.totalRuns || 0),
			0
		);
		const weightedSuccessRate =
			totalRuns > 0
				? robots.reduce(
						(sum, r) =>
							sum +
							(r.metrics?.totalRuns || 0) *
								(r.metrics?.successRate || 100),
						0
					) / totalRuns
				: 100;

		return {
			totalRobots,
			activeRobots,
			successRate: Math.round(weightedSuccessRate),
			errorCount,
		};
	}, [robotsHook.robots]);

	return {
		categories,
		activity: {
			logs: activityHook.logs,
			loading: activityHook.loading,
			stats: activityHook.stats,
			refresh: activityHook.refresh,
		},
		robots: {
			all: robotsHook.robots,
			loading: robotsHook.loading,
			runningRobot: robotsHook.runningRobot,
			error: robotsHook.error,
			refresh: robotsHook.refresh,
			triggerRobot: robotsHook.triggerRobot,
			stopRobot: robotsHook.stopRobot,
			clearError: robotsHook.clearError,
		},
		stats,
	};
}
