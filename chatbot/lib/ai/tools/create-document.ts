/**
 * Create Document Tool
 *
 * AI tool for creating new artifacts (documents, code, sheets).
 * Streams artifact metadata to the client UI while generating content.
 *
 * The tool:
 * 1. Generates a unique document ID
 * 2. Writes metadata to dataStream (kind, id, title)
 * 3. Delegates content generation to the appropriate handler
 * 4. Persists the document to the database
 */
import { tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "@/lib/types";
import { z } from "zod";
import {
	artifactKinds,
	documentHandlersByArtifactKind,
} from "@/lib/artifacts/server";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";

type CreateDocumentProps = {
	session: Session;
	/** Stream for sending artifact metadata and content deltas to client */
	dataStream: UIMessageStreamWriter<ChatMessage>;
};

/**
 * Factory function that creates the createDocument tool.
 * Requires session and dataStream to be injected at creation time.
 */
export const createDocument = ({ session, dataStream }: CreateDocumentProps) =>
	tool({
		description:
			"Create a document for a writing or content creation activities. This tool will call other functions that will generate the contents of the document based on the title and kind.",
		inputSchema: z.object({
			title: z.string(),
			kind: z.enum(artifactKinds),
		}),
		execute: async ({ title, kind }) => {
			const id = generateUUID();

			// Stream metadata to client - these are transient (not persisted in messages)
			// The client uses these to show the artifact panel with correct context
			dataStream.write({
				type: "data-kind",
				data: kind,
				transient: true,
			});

			dataStream.write({
				type: "data-id",
				data: id,
				transient: true,
			});

			dataStream.write({
				type: "data-title",
				data: title,
				transient: true,
			});

			// Signal client to clear any existing content before streaming new
			dataStream.write({
				type: "data-clear",
				data: null,
				transient: true,
			});

			// Find the appropriate handler for this artifact kind (text, code, sheet)
			const documentHandler = documentHandlersByArtifactKind.find(
				(documentHandlerByArtifactKind) =>
					documentHandlerByArtifactKind.kind === kind,
			);

			if (!documentHandler) {
				throw new Error(`No document handler found for kind: ${kind}`);
			}

			// Handler generates content (streaming deltas to client) and saves to DB
			await documentHandler.onCreateDocument({
				id,
				title,
				dataStream,
				session,
			});

			// Signal completion to client (transitions artifact from streaming to idle)
			dataStream.write({ type: "data-finish", data: null, transient: true });

			// Return summary to AI for context in conversation
			return {
				id,
				title,
				kind,
				content: "A document was created and is now visible to the user.",
			};
		},
	});
