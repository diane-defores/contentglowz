"use client";

import { useState } from "react";
import { Loader2, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DeploymentProgress } from "./deployment-progress";
import type { UseSEODeploymentReturn } from "@/hooks/use-seo-deployment";

interface SingleRunPanelProps {
	deployment: UseSEODeploymentReturn;
}

export function SingleRunPanel({ deployment }: SingleRunPanelProps) {
	const [topic, setTopic] = useState("");
	const [dryRun, setDryRun] = useState(false);
	const [noDeploy, setNoDeploy] = useState(false);
	const [targetRepo, setTargetRepo] = useState("");

	const { status, loading, error, runDeployment, stopDeployment } = deployment;

	const handleRun = async () => {
		if (!topic.trim()) return;
		await runDeployment(topic.trim(), {
			dryRun,
			noDeploy,
			targetRepo: targetRepo.trim() || undefined,
		});
	};

	const isRunning = status.running && status.job_type === "single";

	return (
		<div className="space-y-6 pt-4">
			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="topic">Topic</Label>
					<Input
						id="topic"
						placeholder="Enter topic (e.g., 'content marketing strategies')"
						value={topic}
						onChange={(e) => setTopic(e.target.value)}
						disabled={isRunning}
					/>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
						<div className="space-y-0.5">
							<Label htmlFor="dry-run" className="text-sm font-medium">
								Dry Run
							</Label>
							<p className="text-xs text-muted-foreground">
								Preview without changes
							</p>
						</div>
						<Switch
							id="dry-run"
							checked={dryRun}
							onCheckedChange={setDryRun}
							disabled={isRunning}
						/>
					</div>

					<div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
						<div className="space-y-0.5">
							<Label htmlFor="no-deploy" className="text-sm font-medium">
								No Deploy
							</Label>
							<p className="text-xs text-muted-foreground">
								Generate but skip deploy
							</p>
						</div>
						<Switch
							id="no-deploy"
							checked={noDeploy}
							onCheckedChange={setNoDeploy}
							disabled={isRunning}
						/>
					</div>
				</div>

				<div className="space-y-2">
					<Label htmlFor="target-repo">Target Repository (optional)</Label>
					<Input
						id="target-repo"
						placeholder="https://github.com/user/repo"
						value={targetRepo}
						onChange={(e) => setTargetRepo(e.target.value)}
						disabled={isRunning}
					/>
				</div>
			</div>

			<div className="flex gap-2">
				{isRunning ? (
					<Button
						variant="destructive"
						onClick={stopDeployment}
						className="w-full"
					>
						<Square className="mr-2 h-4 w-4" />
						Stop
					</Button>
				) : (
					<Button
						onClick={handleRun}
						disabled={!topic.trim() || loading}
						className="w-full"
					>
						{loading ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Play className="mr-2 h-4 w-4" />
						)}
						Run Deployment
					</Button>
				)}
			</div>

			{error && !isRunning && (
				<div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
					{error}
				</div>
			)}

			{(isRunning || status.progress > 0) && (
				<div className="rounded-lg border p-4">
					<h4 className="font-medium mb-3">
						{isRunning ? "Running" : "Completed"}: {status.topic}
					</h4>
					<DeploymentProgress
						steps={status.steps}
						currentStep={status.current_step}
						progress={status.progress}
						error={status.error}
					/>
				</div>
			)}
		</div>
	);
}
