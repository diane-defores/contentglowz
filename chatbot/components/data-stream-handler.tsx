/**
 * Data Stream Handler Component
 *
 * Processes incoming streaming data from the chat API and routes it
 * to the appropriate artifact handlers.
 *
 * This component bridges the gap between:
 * - The raw data stream from useChat's onData callback
 * - The artifact state management (useArtifact hook)
 *
 * It handles "data-*" prefixed stream parts that control artifact behavior:
 * - data-id: Sets the artifact document ID
 * - data-title: Sets the artifact title
 * - data-kind: Sets the artifact type (text, code, sheet, image)
 * - data-clear: Clears artifact content for fresh generation
 * - data-finish: Signals streaming completion
 *
 * Custom artifact types can define onStreamPart handlers for type-specific
 * data (e.g., codeDelta, textDelta).
 */
"use client";

import { useEffect } from "react";
import { initialArtifactData, useArtifact } from "@/hooks/use-artifact";
import { artifactDefinitions } from "./artifact";
import { useDataStream } from "./data-stream-provider";

export function DataStreamHandler() {
	const { dataStream, setDataStream } = useDataStream();

	const { artifact, setArtifact, setMetadata } = useArtifact();

	/**
	 * Process new data stream parts when they arrive.
	 * Clears the stream after processing to prevent re-processing.
	 */
	useEffect(() => {
		if (!dataStream?.length) {
			return;
		}

		const newDeltas = dataStream.slice();
		setDataStream([]);

		for (const delta of newDeltas) {
			const artifactDefinition = artifactDefinitions.find(
				(currentArtifactDefinition) =>
					currentArtifactDefinition.kind === artifact.kind,
			);

			if (artifactDefinition?.onStreamPart) {
				artifactDefinition.onStreamPart({
					streamPart: delta,
					setArtifact,
					setMetadata,
				});
			}

			setArtifact((draftArtifact) => {
				if (!draftArtifact) {
					return { ...initialArtifactData, status: "streaming" };
				}

				switch (delta.type) {
					case "data-id":
						return {
							...draftArtifact,
							documentId: delta.data,
							status: "streaming",
						};

					case "data-title":
						return {
							...draftArtifact,
							title: delta.data,
							status: "streaming",
						};

					case "data-kind":
						return {
							...draftArtifact,
							kind: delta.data,
							status: "streaming",
						};

					case "data-clear":
						return {
							...draftArtifact,
							content: "",
							status: "streaming",
						};

					case "data-finish":
						return {
							...draftArtifact,
							status: "idle",
						};

					default:
						return draftArtifact;
				}
			});
		}
	}, [dataStream, setArtifact, setMetadata, artifact, setDataStream]);

	return null;
}
