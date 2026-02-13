"use client";

import {
	type Placement,
	autoUpdate,
	flip,
	offset,
	shift,
	size,
	useFloating,
	FloatingPortal,
} from "@floating-ui/react";
import { ArrowRight, X } from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { Button } from "@/components/ui/button";
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

	const placement = useMemo((): Placement => {
		if (align === "center") return side;
		return `${side}-${align}` as Placement;
	}, [side, align]);

	const { refs, floatingStyles } = useFloating({
		placement,
		strategy: "fixed",
		whileElementsMounted: autoUpdate,
		middleware: [
			offset(8),
			flip({
				padding: 16,
				fallbackAxisSideDirection: "start",
			}),
			shift({ padding: 16 }),
			size({
				padding: 16,
				apply({ availableWidth, elements }) {
					Object.assign(elements.floating.style, {
						maxWidth: `${Math.min(320, availableWidth)}px`,
					});
				},
			}),
		],
	});

	const isCurrentStep = isActive && currentStep === step;

	if (!isCurrentStep) {
		return <>{children}</>;
	}

	return (
		<>
			<div
				ref={refs.setReference}
				className="relative ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg transition-shadow"
			>
				{children}
			</div>
			<FloatingPortal>
				<div
					ref={refs.setFloating}
					style={floatingStyles}
					className="z-50 w-80 rounded-md border bg-popover p-4 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
				>
					<div className="space-y-3">
						<div className="flex items-start justify-between gap-2">
							<h4 className="font-semibold text-sm leading-tight">
								{title}
							</h4>
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
						<p className="text-sm text-muted-foreground">
							{description}
						</p>
						<div className="flex justify-between items-center pt-2 border-t">
							<span className="text-xs text-muted-foreground">
								Étape {step}/{TOTAL_STEPS - 1}
							</span>
							<Button
								size="sm"
								onClick={isLast ? complete : nextStep}
							>
								{isLast ? "Terminer" : "Suivant"}
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</FloatingPortal>
		</>
	);
}
