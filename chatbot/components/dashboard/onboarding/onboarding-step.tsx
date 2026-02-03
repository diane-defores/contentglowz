"use client";

import { ArrowRight, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { TOTAL_STEPS } from "./onboarding-content";
import { useOnboardingContext } from "./onboarding-provider";

interface OnboardingStepProps {
	step: number;
	title: string;
	description: string;
	side?: "top" | "bottom" | "left" | "right";
	align?: "start" | "center" | "end";
	children: ReactNode;
	isLast?: boolean;
}

export function OnboardingStep({
	step,
	title,
	description,
	side = "right",
	align = "start",
	children,
	isLast = false,
}: OnboardingStepProps) {
	const { isActive, currentStep, nextStep, skip, complete } =
		useOnboardingContext();

	const isCurrentStep = isActive && currentStep === step;

	if (!isCurrentStep) {
		return <>{children}</>;
	}

	return (
		<HoverCard open={true}>
			<HoverCardTrigger asChild>
				<div className="relative ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg transition-shadow">
					{children}
				</div>
			</HoverCardTrigger>
			<HoverCardContent
				side={side}
				align={align}
				sideOffset={8}
				className="w-80 z-50"
			>
				<div className="space-y-3">
					<div className="flex items-start justify-between gap-2">
						<h4 className="font-semibold text-sm leading-tight">{title}</h4>
						<Button
							variant="ghost"
							size="sm"
							className="h-6 w-6 p-0 shrink-0"
							onClick={skip}
						>
							<X className="h-4 w-4" />
							<span className="sr-only">Fermer</span>
						</Button>
					</div>
					<p className="text-sm text-muted-foreground">{description}</p>
					<div className="flex justify-between items-center pt-2 border-t">
						<span className="text-xs text-muted-foreground">
							Étape {step}/{TOTAL_STEPS - 1}
						</span>
						<Button size="sm" onClick={isLast ? complete : nextStep}>
							{isLast ? "Terminer" : "Suivant"}
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</div>
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}
