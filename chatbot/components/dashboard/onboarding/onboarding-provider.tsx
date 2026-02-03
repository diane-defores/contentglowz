"use client";

import { createContext, type ReactNode, useContext } from "react";
import { useOnboarding } from "@/hooks/use-onboarding";

interface OnboardingContextValue {
	isActive: boolean;
	currentStep: number;
	completed: boolean;
	skipped: boolean;
	nextStep: () => void;
	skip: () => void;
	complete: () => void;
	reset: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

interface OnboardingProviderProps {
	children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
	const onboarding = useOnboarding("croissance");

	return (
		<OnboardingContext.Provider value={onboarding}>
			{children}
		</OnboardingContext.Provider>
	);
}

export function useOnboardingContext(): OnboardingContextValue {
	const context = useContext(OnboardingContext);
	if (!context) {
		throw new Error(
			"useOnboardingContext must be used within an OnboardingProvider",
		);
	}
	return context;
}
