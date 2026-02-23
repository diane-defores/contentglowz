"use client";

import { Check, Download, Edit3, Loader2, Mic, RefreshCw, Type } from "lucide-react";
import type { PipelineStep } from "@/hooks/use-reels";

const STEPS = [
	{ key: "downloading", label: "Download", icon: Download },
	{ key: "transcribing", label: "Transcribe", icon: Type },
	{ key: "rewriting", label: "AI Rewrite", icon: RefreshCw },
	{ key: "editing", label: "Edit Copy", icon: Edit3 },
	{ key: "recording", label: "Record Voice", icon: Mic },
	{ key: "retranscribing", label: "Final Sync", icon: Type },
] as const;

const STEP_ORDER: PipelineStep[] = [
	"downloading",
	"transcribing",
	"rewriting",
	"editing",
	"recording",
	"retranscribing",
	"done",
];

interface ReelsPipelineStepperProps {
	currentStep: PipelineStep;
}

export function ReelsPipelineStepper({ currentStep }: ReelsPipelineStepperProps) {
	if (currentStep === "idle") return null;

	const currentIndex = STEP_ORDER.indexOf(currentStep);

	return (
		<div className="flex items-center gap-1 overflow-x-auto py-3">
			{STEPS.map((step, i) => {
				const stepIndex = STEP_ORDER.indexOf(step.key);
				const isActive = step.key === currentStep;
				const isDone =
					currentStep === "done" || stepIndex < currentIndex;
				const Icon = step.icon;

				return (
					<div key={step.key} className="flex items-center">
						{i > 0 && (
							<div
								className={`mx-1 h-px w-4 sm:w-8 ${isDone ? "bg-green-500" : "bg-border"}`}
							/>
						)}
						<div
							className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
								isActive
									? "bg-primary text-primary-foreground"
									: isDone
										? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
										: "bg-muted text-muted-foreground"
							}`}
						>
							{isDone ? (
								<Check className="h-3 w-3" />
							) : isActive ? (
								<Loader2 className="h-3 w-3 animate-spin" />
							) : (
								<Icon className="h-3 w-3" />
							)}
							<span className="hidden sm:inline">{step.label}</span>
						</div>
					</div>
				);
			})}
		</div>
	);
}
