"use client";

import {
	Activity,
	AlertCircle,
	ArrowLeft,
	Bot,
	CheckCircle,
	Loader2,
	RefreshCw,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useMissionControl } from "@/hooks/use-mission-control";
import { useUptime } from "@/hooks/use-uptime";
import { ActivityFeed } from "./activity-feed";
import { ActivityTab } from "./activity-tab";
import { MissionCategory } from "./mission-category";
import {
	ONBOARDING_STEPS,
	OnboardingProvider,
	OnboardingStep,
	WelcomeModal,
} from "./onboarding";
import { UptimeTab } from "./uptime-tab";

interface MissionControlProps {
	projectId?: string;
	onNavigateToTab?: (tab: string) => void;
}

export function MissionControl({ projectId, onNavigateToTab }: MissionControlProps) {
	return (
		<OnboardingProvider>
			<MissionControlContent projectId={projectId} onNavigateToTab={onNavigateToTab} />
		</OnboardingProvider>
	);
}

function MissionControlContent({ projectId, onNavigateToTab }: MissionControlProps) {
	const { categories, activity, robots, stats } = useMissionControl(projectId);
	const uptime = useUptime();
	const [showAllActivity, setShowAllActivity] = useState(false);
	const [view, setView] = useState<"main" | "uptime">("main");

	const uptimeColor =
		uptime.overallStatus === "operational"
			? "bg-green-500"
			: uptime.overallStatus === "degraded"
				? "bg-yellow-500"
				: "bg-red-500";

	const uptimeLabel =
		uptime.overallStatus === "operational"
			? "Operational"
			: uptime.overallStatus === "degraded"
				? "Degraded"
				: "Outage";

	return (
		<>
			{/* Onboarding Welcome Modal */}
			<WelcomeModal />

			<div className="space-y-6">
				{/* Error Banner */}
				{robots.error && (
					<div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50 p-4">
						<div className="flex items-center gap-3">
							<AlertCircle className="h-5 w-5 text-red-500" />
							<div className="flex-1">
								<p className="text-sm text-red-600 dark:text-red-400">
									{robots.error}
								</p>
							</div>
							<Button onClick={robots.clearError} variant="ghost" size="sm">
								Dismiss
							</Button>
						</div>
					</div>
				)}

				{/* Overview Stats Bar - Sticky on mobile */}
				<div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-4 px-4 py-3 sm:relative sm:mx-0 sm:px-0 sm:py-0 sm:bg-transparent sm:backdrop-blur-none border-b sm:border-0">
					<div className="flex items-center justify-between mb-3 sm:mb-4">
						<h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
							<Zap className="h-5 w-5 text-yellow-500" />
							Mission Control
						</h2>
						<div className="flex items-center gap-2">
							{view === "uptime" && (
								<Button
									onClick={() => setView("main")}
									variant="ghost"
									size="sm"
									className="h-8"
								>
									<ArrowLeft className="h-3.5 w-3.5 sm:mr-1.5" />
									<span className="hidden sm:inline">Back</span>
								</Button>
							)}
							<Button
								onClick={() => setView(view === "uptime" ? "main" : "uptime")}
								variant={view === "uptime" ? "default" : "outline"}
								size="sm"
								className="h-8"
							>
								<span className={`h-2 w-2 rounded-full ${uptimeColor} mr-1.5`} />
								<span className="hidden sm:inline">{uptimeLabel}</span>
								<Activity className="h-3.5 w-3.5 sm:hidden" />
							</Button>
							{view === "main" && (
								<Button
									onClick={() => {
										robots.refresh();
										activity.refresh();
									}}
									variant="outline"
									size="sm"
									className="h-8"
								>
									<RefreshCw className="h-3.5 w-3.5 sm:mr-2" />
									<span className="hidden sm:inline">Refresh</span>
								</Button>
							)}
						</div>
					</div>

					{view === "main" && (
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
							<Card className="p-3 sm:p-4">
								<div className="flex items-center gap-2">
									<Bot className="h-4 w-4 text-muted-foreground" />
									<div>
										<div className="text-lg sm:text-2xl font-bold">
											{stats.totalRobots}
										</div>
										<div className="text-xs sm:text-sm text-muted-foreground">
											Robots
										</div>
									</div>
								</div>
							</Card>
							<Card className="p-3 sm:p-4">
								<div className="flex items-center gap-2">
									<Activity className="h-4 w-4 text-blue-500" />
									<div>
										<div className="text-lg sm:text-2xl font-bold text-blue-600">
											{stats.activeRobots}
										</div>
										<div className="text-xs sm:text-sm text-muted-foreground">
											Active
										</div>
									</div>
								</div>
							</Card>
							<Card className="p-3 sm:p-4">
								<div className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-green-500" />
									<div>
										<div className="text-lg sm:text-2xl font-bold text-green-600">
											{stats.successRate}%
										</div>
										<div className="text-xs sm:text-sm text-muted-foreground">
											Success
										</div>
									</div>
								</div>
							</Card>
							<Card className="p-3 sm:p-4">
								<div className="flex items-center gap-2">
									<AlertCircle className="h-4 w-4 text-red-500" />
									<div>
										<div className="text-lg sm:text-2xl font-bold text-red-600">
											{stats.errorCount}
										</div>
										<div className="text-xs sm:text-sm text-muted-foreground">
											Errors
										</div>
									</div>
								</div>
							</Card>
						</div>
					)}
				</div>

				{view === "uptime" ? (
					/* Inline Uptime View */
					<UptimeTab />
				) : (
					<>
						{/* Main Content Grid */}
						<div className="grid gap-4 lg:grid-cols-[1fr,300px] xl:grid-cols-[1fr,350px]">
							{/* Categories Section */}
							<div className="space-y-4">
								{robots.loading ? (
									<div className="flex items-center justify-center py-12">
										<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
										<span className="ml-3 text-muted-foreground">
											Loading robots...
										</span>
									</div>
								) : (
									categories.map((category, index) => {
										const isGrowthCategory = category.id === "growth";

										// Wrap the growth category with onboarding steps
										if (isGrowthCategory) {
											return (
												<OnboardingStep
													key={category.id}
													step={1}
													title={ONBOARDING_STEPS.croissance.title}
													description={ONBOARDING_STEPS.croissance.description}
													side="right"
												>
													<OnboardingStep
														step={2}
														title={ONBOARDING_STEPS.seoRobot.title}
														description={ONBOARDING_STEPS.seoRobot.description}
														side="right"
													>
														<OnboardingStep
															step={3}
															title={ONBOARDING_STEPS.runButton.title}
															description={ONBOARDING_STEPS.runButton.description}
															side="bottom"
															isLast
														>
															<MissionCategory
																id={category.id}
																title={category.name}
																icon={
																	category.icon as
																		| "TrendingUp"
																		| "FileText"
																		| "Wrench"
																}
																color={
																	category.color as "blue" | "purple" | "orange"
																}
																robots={category.robots}
																runningRobot={robots.runningRobot}
																onTriggerRobot={robots.triggerRobot}
																onStopRobot={robots.stopRobot}
																defaultOpen={index === 0}
																onNavigateToTab={onNavigateToTab}
															/>
														</OnboardingStep>
													</OnboardingStep>
												</OnboardingStep>
											);
										}

										return (
											<MissionCategory
												key={category.id}
												id={category.id}
												title={category.name}
												icon={category.icon as "TrendingUp" | "FileText" | "Wrench"}
												color={category.color as "blue" | "purple" | "orange"}
												robots={category.robots}
												runningRobot={robots.runningRobot}
												onTriggerRobot={robots.triggerRobot}
												onStopRobot={robots.stopRobot}
												defaultOpen={index === 0}
												onNavigateToTab={onNavigateToTab}
											/>
										);
									})
								)}
							</div>

							{/* Activity Sidebar - Hidden on mobile, shown in bottom section */}
							<div className="hidden lg:block">
								<Card className="p-4 sticky top-4">
									<div className="flex items-center justify-between mb-4">
										<h3 className="font-semibold flex items-center gap-2">
											<Zap className="h-4 w-4 text-yellow-500" />
											Recent Activity
										</h3>
										{activity.stats.running > 0 && (
											<Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
												{activity.stats.running} running
											</Badge>
										)}
									</div>
									<ActivityFeed
										logs={activity.logs}
										loading={activity.loading}
										limit={5}
										onViewAll={() => setShowAllActivity(true)}
									/>
								</Card>
							</div>
						</div>

						{/* Mobile Activity Section */}
						<div className="lg:hidden">
							<Card className="p-4">
								<div className="flex items-center justify-between mb-4">
									<h3 className="font-semibold flex items-center gap-2">
										<Zap className="h-4 w-4 text-yellow-500" />
										Recent Activity
										{activity.stats.running > 0 && (
											<Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 ml-2">
												{activity.stats.running}
											</Badge>
										)}
									</h3>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setShowAllActivity(true)}
									>
										View all
									</Button>
								</div>
								<ActivityFeed
									logs={activity.logs}
									loading={activity.loading}
									limit={3}
								/>
							</Card>
						</div>

						{/* Full Activity Modal */}
						<Dialog open={showAllActivity} onOpenChange={setShowAllActivity}>
							<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
								<DialogHeader>
									<DialogTitle>Activity Log</DialogTitle>
								</DialogHeader>
								<ActivityTab projectId={projectId} />
							</DialogContent>
						</Dialog>
					</>
				)}
			</div>
		</>
	);
}
