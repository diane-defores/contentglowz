"use client";

import { Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ONBOARDING_STEPS } from "./onboarding-content";
import { useOnboardingContext } from "./onboarding-provider";

export function WelcomeModal() {
	const { isActive, currentStep, nextStep, skip } = useOnboardingContext();

	const isOpen = isActive && currentStep === 0;

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && skip()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader className="space-y-4">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
						<Rocket className="h-8 w-8 text-primary" />
					</div>
					<DialogTitle className="text-center text-xl">
						{ONBOARDING_STEPS.welcome.title}
					</DialogTitle>
					<DialogDescription className="text-center">
						{ONBOARDING_STEPS.welcome.description}
					</DialogDescription>
				</DialogHeader>

				<div className="flex items-center justify-center gap-2 py-4">
					<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
						<Sparkles className="h-4 w-4 text-yellow-500" />
						<span>4 étapes rapides</span>
					</div>
				</div>

				<DialogFooter className="flex-col gap-2 sm:flex-row">
					<Button variant="ghost" onClick={skip} className="w-full sm:w-auto">
						{ONBOARDING_STEPS.welcome.skip}
					</Button>
					<Button onClick={nextStep} className="w-full sm:w-auto">
						{ONBOARDING_STEPS.welcome.cta}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
