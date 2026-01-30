/**
 * Update Document Tool
 *
 * AI tool for modifying existing artifacts based on user instructions.
 * Retrieves the current document, applies changes, and streams updates.
 *
 * Key design: The tool receives a description of changes (not the new content),
 * allowing the handler to generate appropriate modifications.
 */
import { tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { documentHandlersByArtifactKind } from "@/lib/artifacts/server";
import { getDocumentById } from "@/lib/db/queries";
import type { ChatMessage } from "@/lib/types";

type UpdateDocumentProps = {
	session: Session;
	dataStream: UIMessageStreamWriter<ChatMessage>;
};

/**
 * Factory function that creates the updateDocument tool.
 * Similar pattern to createDocument - injects session and dataStream.
 */
export const updateDocument = ({ session, dataStream }: UpdateDocumentProps) =>
	tool({
		description: "Update a document with the given description.",
		inputSchema: z.object({
			id: z.string().describe("The ID of the document to update"),
			description: z
				.string()
				.describe("The description of changes that need to be made"),
		}),
		execute: async ({ id, description }) => {
			// Fetch the most recent version of the document
			const document = await getDocumentById({ id });

			if (!document) {
				return {
					error: "Document not found",
				};
			}

			// Clear existing content before streaming updates (lines 45-49)
			dataStream.write({
				type: "data-clear",
				data: null,
				transient: true,
			});

			// Find handler matching the document's kind
			const documentHandler = documentHandlersByArtifactKind.find(
				(documentHandlerByArtifactKind) =>
					documentHandlerByArtifactKind.kind === document.kind,
			);

			if (!documentHandler) {
				throw new Error(`No document handler found for kind: ${document.kind}`);
			}

			// Handler generates new content based on description and current content
			await documentHandler.onUpdateDocument({
				document,
				description,
				dataStream,
				session,
			});

			dataStream.write({ type: "data-finish", data: null, transient: true });

			return {
				id,
				title: document.title,
				kind: document.kind,
				content: "The document has been updated successfully.",
			};
		},
	});
