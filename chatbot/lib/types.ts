/**
 * Chat Message Types and Streaming Data Definitions
 *
 * This module defines the type system for messages flowing through the chat system.
 * Messages use a flexible `parts` array structure to support multiple content types
 * and enable real-time streaming updates.
 *
 * Key concepts:
 * - Messages contain `parts[]` where each part has `{ type, content }`
 * - CustomUIDataTypes define streaming data types beyond standard text
 * - ChatTools type-safely reference the AI tools available in this application
 */
import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type { ArtifactKind } from "@/components/artifact";
import type { createDocument } from "./ai/tools/create-document";
import type { getWeather } from "./ai/tools/get-weather";
import type { editArticle } from "./ai/tools/edit-article";
import type { getPendingValidations } from "./ai/tools/get-pending-validations";
import type { requestSuggestions } from "./ai/tools/request-suggestions";
import type { updateDocument } from "./ai/tools/update-document";
import type { Suggestion } from "./db/schema";
import type { AppUsage } from "./usage";

/** Wire format for data stream messages (used in SSE responses) */
export type DataPart = { type: "append-message"; message: string };

/** Schema for message metadata stored alongside each message */
export const messageMetadataSchema = z.object({
	createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

// Infer tool types from their definitions for type-safe tool invocations
type weatherTool = InferUITool<typeof getWeather>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<ReturnType<typeof requestSuggestions>>;
type getPendingValidationsTool = InferUITool<typeof getPendingValidations>;
type editArticleTool = InferUITool<typeof editArticle>;

/** All AI tools available in chat, keyed by their invocation name */
export type ChatTools = {
	getWeather: weatherTool;
	createDocument: createDocumentTool;
	updateDocument: updateDocumentTool;
	requestSuggestions: requestSuggestionsTool;
	getPendingValidations: getPendingValidationsTool;
	editArticle: editArticleTool;
};

/**
 * Custom streaming data types beyond standard AI SDK types.
 * These are written to the data stream and handled by DataStreamHandler.
 *
 * Delta types (textDelta, codeDelta, etc.) represent incremental content updates.
 * Control types (clear, finish) manage artifact lifecycle.
 */
export type CustomUIDataTypes = {
	textDelta: string;
	imageDelta: string;
	sheetDelta: string;
	codeDelta: string;
	suggestion: Suggestion;
	appendMessage: string;
	id: string;
	title: string;
	kind: ArtifactKind;
	clear: null;
	finish: null;
	usage: AppUsage;
};

/**
 * The primary message type used throughout the application.
 * Combines base UIMessage with our custom metadata, data types, and tools.
 */
export type ChatMessage = UIMessage<
	MessageMetadata,
	CustomUIDataTypes,
	ChatTools
>;

/** File attachment structure for multimodal inputs */
export type Attachment = {
	name: string;
	url: string;
	contentType: string;
};

/** Session type replacing next-auth Session */
export interface Session {
	user: {
		id: string;
		email?: string | null;
		name?: string | null;
		image?: string | null;
	};
}
