/**
 * Artifact State Management Hook
 *
 * Manages the UI state for the artifact panel using SWR for reactive updates.
 * Uses SWR's cache as a simple global state store (no fetcher, just cache).
 *
 * The pattern allows:
 * - Centralized artifact state accessible from any component
 * - Reactive updates when artifact content changes
 * - Selector-based access for performance optimization
 */
"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import type { UIArtifact } from "@/components/artifact";

/** Default artifact state before any document is opened */
export const initialArtifactData: UIArtifact = {
	documentId: "init",
	content: "",
	kind: "text",
	title: "",
	status: "idle",
	isVisible: false,
	boundingBox: {
		top: 0,
		left: 0,
		width: 0,
		height: 0,
	},
};

type Selector<T> = (state: UIArtifact) => T;

/**
 * Selector hook for accessing specific artifact properties.
 * Use this for components that only need part of the artifact state
 * to avoid unnecessary re-renders.
 */
export function useArtifactSelector<Selected>(selector: Selector<Selected>) {
	const { data: localArtifact } = useSWR<UIArtifact>("artifact", null, {
		fallbackData: initialArtifactData,
	});

	const selectedValue = useMemo(() => {
		if (!localArtifact) {
			return selector(initialArtifactData);
		}
		return selector(localArtifact);
	}, [localArtifact, selector]);

	return selectedValue;
}

/**
 * Full artifact state hook with read/write access.
 * Provides the complete artifact object and an updater function.
 *
 * The setArtifact function supports both direct values and updater functions,
 * similar to React's useState pattern.
 */
export function useArtifact() {
	const { data: localArtifact, mutate: setLocalArtifact } = useSWR<UIArtifact>(
		"artifact",
		null,
		{
			fallbackData: initialArtifactData,
		},
	);

	const artifact = useMemo(() => {
		if (!localArtifact) {
			return initialArtifactData;
		}
		return localArtifact;
	}, [localArtifact]);

	/**
	 * Updater function supporting both direct values and functional updates.
	 * Wraps SWR's mutate to provide a familiar React setState API.
	 */
	const setArtifact = useCallback(
		(updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact)) => {
			setLocalArtifact((currentArtifact) => {
				const artifactToUpdate = currentArtifact || initialArtifactData;

				if (typeof updaterFn === "function") {
					return updaterFn(artifactToUpdate);
				}

				return updaterFn;
			});
		},
		[setLocalArtifact],
	);

	/**
	 * Artifact-specific metadata storage.
	 * Each artifact type can store additional metadata (e.g., code outputs, suggestions).
	 * Key is scoped to documentId to isolate metadata between artifacts.
	 */
	const { data: localArtifactMetadata, mutate: setLocalArtifactMetadata } =
		useSWR<any>(
			() =>
				artifact.documentId ? `artifact-metadata-${artifact.documentId}` : null,
			null,
			{
				fallbackData: null,
			},
		);

	return useMemo(
		() => ({
			artifact,
			setArtifact,
			metadata: localArtifactMetadata,
			setMetadata: setLocalArtifactMetadata,
		}),
		[artifact, setArtifact, localArtifactMetadata, setLocalArtifactMetadata],
	);
}
