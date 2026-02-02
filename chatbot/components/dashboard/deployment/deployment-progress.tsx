"use client";

import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { StepInfo } from "@/hooks/use-seo-deployment";

interface DeploymentProgressProps {
	steps: StepInfo[];
	currentStep?: string;
	progress: number;
	error?: string;
}

const STEP_LABELS: Record<string, string> = {
	research: "Research & Analysis",
	strategy: "Content Strategy",
	content: "Content Generation",
	technical_seo: "Technical SEO",
	editing: "Final Editing",
	deployment: "Deployment",
};

function StepIcon({ status }: { status: StepInfo["status"] }) {
	switch (status) {
		case "completed":
			return <CheckCircle2 className="h-4 w-4 text-green-500" />;
		case "running":
			return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
		case "error":
			return <XCircle className="h-4 w-4 text-red-500" />;
		default:
			return <Circle className="h-4 w-4 text-muted-foreground" />;
	}
}

export function DeploymentProgress({
	steps,
	currentStep,
	progress,
	error,
}: DeploymentProgressProps) {
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">Overall Progress</span>
					<span className="font-medium">{progress}%</span>
				</div>
				<Progress value={progress} className="h-2" />
			</div>

			{error && (
				<div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
					{error}
				</div>
			)}

			<div className="space-y-2">
				{steps.map((step) => (
					<div
						key={step.name}
						className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
							step.status === "running"
								? "bg-blue-50 border border-blue-100"
								: step.status === "error"
									? "bg-red-50 border border-red-100"
									: ""
						}`}
					>
						<StepIcon status={step.status} />
						<span
							className={`flex-1 text-sm ${
								step.status === "running"
									? "font-medium text-blue-700"
									: step.status === "completed"
										? "text-green-700"
										: step.status === "error"
											? "text-red-700"
											: "text-muted-foreground"
							}`}
						>
							{STEP_LABELS[step.name] || step.name}
						</span>
						{step.duration_seconds !== undefined && step.duration_seconds > 0 && (
							<span className="text-xs text-muted-foreground">
								{step.duration_seconds.toFixed(1)}s
							</span>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
