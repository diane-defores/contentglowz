"use client";

import { useCallback, useEffect, useState } from "react";

export interface RobotAgent {
	name: string;
	status: "idle" | "running" | "error" | "disabled";
	description: string;
}

export interface Robot {
	id: string;
	name: string;
	description: string;
	status: "operational" | "running" | "error" | "disabled";
	lastRun?: Date;
	nextRun?: Date;
	agents: RobotAgent[];
	metrics?: {
		totalRuns: number;
		successRate: number;
		avgDuration: number;
	};
}

export interface RobotConfig {
	seoRobot: {
		enabled: boolean;
		autoRun: boolean;
		schedule?: string;
	};
	newsletterRobot: {
		enabled: boolean;
		autoRun: boolean;
		schedule?: string;
	};
	articleRobot: {
		enabled: boolean;
		autoRun: boolean;
	};
	schedulerRobot: {
		enabled: boolean;
		autoRun: boolean;
		schedule?: string;
	};
}

const defaultRobots: Robot[] = [
	{
		id: "seo",
		name: "SEO Robot",
		description: "Multi-agent CrewAI system for SEO optimization with 6 specialized agents",
		status: "operational",
		agents: [
			{ name: "Research Analyst", status: "idle", description: "Competitive intelligence, SERP analysis" },
			{ name: "Content Strategist", status: "idle", description: "Content architecture, topic clusters" },
			{ name: "Marketing Strategist", status: "idle", description: "Business priorities, ROI analysis" },
			{ name: "Copywriter", status: "idle", description: "SEO-optimized content creation" },
			{ name: "Technical SEO", status: "idle", description: "Schema, metadata, on-page optimization" },
			{ name: "Editor", status: "idle", description: "Final QA, consistency validation" },
		],
		metrics: { totalRuns: 0, successRate: 100, avgDuration: 0 },
	},
	{
		id: "newsletter",
		name: "Newsletter Robot",
		description: "PydanticAI-based automated newsletter generation with Exa AI",
		status: "operational",
		agents: [
			{ name: "Content Curator", status: "idle", description: "Exa AI search and filtering" },
			{ name: "Newsletter Writer", status: "idle", description: "Content structuring and formatting" },
		],
		metrics: { totalRuns: 0, successRate: 100, avgDuration: 0 },
	},
	{
		id: "articles",
		name: "Article Generator",
		description: "CrewAI agent using Firecrawl for competitor analysis and content generation",
		status: "operational",
		agents: [
			{ name: "Competitor Crawler", status: "idle", description: "Firecrawl site analysis" },
			{ name: "Content Generator", status: "idle", description: "Original article creation" },
		],
		metrics: { totalRuns: 0, successRate: 100, avgDuration: 0 },
	},
	{
		id: "scheduler",
		name: "Scheduler Robot",
		description: "Multi-agent system for content scheduling, publishing, and technical analysis",
		status: "operational",
		agents: [
			{ name: "Calendar Manager", status: "idle", description: "Publishing schedule optimization" },
			{ name: "Publishing Agent", status: "idle", description: "Git deployment, Google indexing" },
			{ name: "Site Health Monitor", status: "idle", description: "Technical SEO analysis" },
			{ name: "Tech Stack Analyzer", status: "idle", description: "Dependency and vulnerability scanning" },
		],
		metrics: { totalRuns: 0, successRate: 100, avgDuration: 0 },
	},
];

export function useRobots() {
	const [robots, setRobots] = useState<Robot[]>(defaultRobots);
	const [loading, setLoading] = useState(false);
	const [runningRobot, setRunningRobot] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const fetchRobotStatus = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			// Try to get status from the SEO API
			const response = await fetch("/api/seo/health");
			if (response.ok) {
				const health = await response.json();

				// Update robot statuses based on API health
				setRobots((prev) =>
					prev.map((robot) => {
						if (robot.id === "seo") {
							const agentStatus = health.agents || {};
							return {
								...robot,
								status: health.status === "healthy" ? "operational" : "error",
								agents: robot.agents.map((agent) => ({
									...agent,
									status: agentStatus[agent.name.toLowerCase().replace(/\s/g, "_")] === "available"
										? "idle"
										: "error",
								})),
							};
						}
						return robot;
					}),
				);
			}
		} catch (err) {
			console.error("Failed to fetch robot status:", err);
			// Don't set error - just use default status
		} finally {
			setLoading(false);
		}
	}, []);

	const triggerRobot = useCallback(
		async (robotId: string, action: string = "run"): Promise<boolean> => {
			setError(null);
			setRunningRobot(robotId);

			// Update robot status to running
			setRobots((prev) =>
				prev.map((robot) =>
					robot.id === robotId
						? {
								...robot,
								status: "running",
								agents: robot.agents.map((a) => ({ ...a, status: "running" })),
							}
						: robot,
				),
			);

			try {
				// Simulate robot execution (replace with actual API call)
				let endpoint = "";
				switch (robotId) {
					case "seo":
						endpoint = "/api/seo/api/mesh/analyze";
						break;
					case "scheduler":
						endpoint = "/api/seo/api/scheduler/run";
						break;
					default:
						// Simulate for robots without endpoints yet
						await new Promise((resolve) => setTimeout(resolve, 2000));
						break;
				}

				if (endpoint) {
					const response = await fetch(endpoint, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ action }),
					});

					if (!response.ok) {
						throw new Error(`Robot ${robotId} failed to ${action}`);
					}
				}

				// Update robot status to operational
				setRobots((prev) =>
					prev.map((robot) =>
						robot.id === robotId
							? {
									...robot,
									status: "operational",
									lastRun: new Date(),
									agents: robot.agents.map((a) => ({ ...a, status: "idle" })),
									metrics: robot.metrics
										? {
												...robot.metrics,
												totalRuns: robot.metrics.totalRuns + 1,
											}
										: undefined,
								}
							: robot,
					),
				);

				return true;
			} catch (err) {
				const message = err instanceof Error ? err.message : "Robot execution failed";
				setError(message);

				// Update robot status to error
				setRobots((prev) =>
					prev.map((robot) =>
						robot.id === robotId
							? {
									...robot,
									status: "error",
									agents: robot.agents.map((a) => ({ ...a, status: "error" })),
								}
							: robot,
					),
				);

				return false;
			} finally {
				setRunningRobot(null);
			}
		},
		[],
	);

	const stopRobot = useCallback(async (robotId: string): Promise<boolean> => {
		setRunningRobot(null);
		setRobots((prev) =>
			prev.map((robot) =>
				robot.id === robotId
					? {
							...robot,
							status: "operational",
							agents: robot.agents.map((a) => ({ ...a, status: "idle" })),
						}
					: robot,
			),
		);
		return true;
	}, []);

	useEffect(() => {
		fetchRobotStatus();
	}, [fetchRobotStatus]);

	return {
		robots,
		loading,
		runningRobot,
		error,
		refresh: fetchRobotStatus,
		triggerRobot,
		stopRobot,
		clearError: () => setError(null),
	};
}
