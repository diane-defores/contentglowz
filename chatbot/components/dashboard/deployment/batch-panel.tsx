"use client";

import { useState } from "react";
import { Loader2, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { DeploymentProgress } from "./deployment-progress";
import type { UseSEODeploymentReturn } from "@/hooks/use-seo-deployment";

interface BatchPanelProps {
	deployment: UseSEODeploymentReturn;
}

export function BatchPanel({ deployment }: BatchPanelProps) {
	const [topicsText, setTopicsText] = useState("");
	const [delaySeconds, setDelaySeconds] = useState(60);

	const { status, loading, error, runBatch, stopDeployment } = deployment;

	const topics = topicsText
		.split("\n")
		.map((t) => t.trim())
		.filter((t) => t.length > 0);

	const handleRun = async () => {
		if (topics.length === 0) return;
		await runBatch(topics, delaySeconds);
	};

	const isRunning = status.running && status.job_type === "batch";
	const batchProgress = status.batch_progress;

	return (
		<div className="space-y-6 pt-4">
			<div className="space-y-4">
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="topics">Topics (one per line)</Label>
						<span className="text-xs text-muted-foreground">
							{topics.length} topic{topics.length !== 1 ? "s" : ""}
						</span>
					</div>
					<Textarea
						id="topics"
						placeholder={`content marketing strategies\nSEO best practices\nemail marketing tips`}
						value={topicsText}
						onChange={(e) => setTopicsText(e.target.value)}
						disabled={isRunning}
						rows={5}
					/>
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="delay">Delay Between Topics</Label>
						<span className="text-sm font-medium">{delaySeconds}s</span>
					</div>
					<Slider
						id="delay"
						min={30}
						max={300}
						step={10}
						value={[delaySeconds]}
						onValueChange={([value]) => setDelaySeconds(value)}
						disabled={isRunning}
					/>
					<p className="text-xs text-muted-foreground">
						Wait time between processing each topic (30-300 seconds)
					</p>
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
						Stop Batch
					</Button>
				) : (
					<Button
						onClick={handleRun}
						disabled={topics.length === 0 || loading}
						className="w-full"
					>
						{loading ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Play className="mr-2 h-4 w-4" />
						)}
						Run Batch ({topics.length} topics)
					</Button>
				)}
			</div>

			{error && !isRunning && (
				<div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
					{error}
				</div>
			)}

			{batchProgress && (
				<div className="rounded-lg border p-4 space-y-4">
					<div className="flex items-center justify-between">
						<h4 className="font-medium">Batch Progress</h4>
						<span className="text-sm text-muted-foreground">
							{batchProgress.completed} / {batchProgress.total} topics
						</span>
					</div>

					<Progress
						value={(batchProgress.completed / batchProgress.total) * 100}
						className="h-2"
					/>

					{batchProgress.current_topic && (
						<p className="text-sm">
							<span className="text-muted-foreground">Current: </span>
							<span className="font-medium">{batchProgress.current_topic}</span>
						</p>
					)}

					{status.steps.length > 0 && (
						<DeploymentProgress
							steps={status.steps}
							currentStep={status.current_step}
							progress={status.progress}
							error={status.error}
						/>
					)}
				</div>
			)}
		</div>
	);
}
