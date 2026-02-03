"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "usehooks-ts";

interface OnboardingState {
	completed: boolean;
	skipped: boolean;
	lastStep: number;
}

const defaultState: OnboardingState = {
	completed: false,
	skipped: false,
	lastStep: 0,
};

export function useOnboarding(key: string = "onboarding-croissance") {
	const [state, setState] = useLocalStorage<OnboardingState>(
		`onboarding-${key}`,
		defaultState,
	);
	const [currentStep, setCurrentStep] = useLocalStorage(
		`onboarding-${key}-step`,
		0,
	);

	const isActive = useMemo(
		() => !state.completed && !state.skipped,
		[state.completed, state.skipped],
	);

	const nextStep = useCallback(() => {
		setCurrentStep((prev) => prev + 1);
	}, [setCurrentStep]);

	const skip = useCallback(() => {
		setState((prev) => ({ ...prev, skipped: true }));
		setCurrentStep(0);
	}, [setState, setCurrentStep]);

	const complete = useCallback(() => {
		setState((prev) => ({ ...prev, completed: true }));
		setCurrentStep(0);
	}, [setState, setCurrentStep]);

	const reset = useCallback(() => {
		setState(defaultState);
		setCurrentStep(0);
	}, [setState, setCurrentStep]);

	return {
		isActive,
		currentStep,
		completed: state.completed,
		skipped: state.skipped,
		nextStep,
		skip,
		complete,
		reset,
	};
}
