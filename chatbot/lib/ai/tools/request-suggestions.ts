/**
 * Request Suggestions Tool
 *
 * AI tool for generating inline suggestions to improve document content.
 * Streams suggestions as they're generated, allowing real-time UI updates.
 *
 * The tool analyzes the document and produces specific edit recommendations
 * with original text, suggested replacement, and explanation.
 */
import { streamObject, tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { getDocumentById, saveSuggestions } from "@/lib/db/queries";
import type { Suggestion } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { myProvider } from "../providers";

type RequestSuggestionsProps = {
	session: Session;
	dataStream: UIMessageStreamWriter<ChatMessage>;
};

/**
 * Factory function that creates the requestSuggestions tool.
 * Uses streamObject to generate structured suggestion data incrementally.
 */
export const requestSuggestions = ({
	session,
	dataStream,
}: RequestSuggestionsProps) =>
	tool({
		description: "Request suggestions for a document",
		inputSchema: z.object({
			documentId: z
				.string()
				.describe("The ID of the document to request edits"),
		}),
		execute: async ({ documentId }) => {
			const document = await getDocumentById({ id: documentId });

			if (!document || !document.content) {
				return {
					error: "Document not found",
				};
			}

			// Collect suggestions for batch DB insert
			const suggestions: Omit<
				Suggestion,
				"userId" | "createdAt" | "documentCreatedAt"
			>[] = [];

			/**
			 * Uses streamObject to generate structured array of suggestions.
			 * Each element contains original text, replacement, and description.
			 * Limited to 5 suggestions to avoid overwhelming the user.
			 */
			const { elementStream } = streamObject({
				model: myProvider.languageModel("artifact-model"),
				system:
					"You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.",
				prompt: document.content,
				output: "array",
				schema: z.object({
					originalSentence: z.string().describe("The original sentence"),
					suggestedSentence: z.string().describe("The suggested sentence"),
					description: z.string().describe("The description of the suggestion"),
				}),
			});

			// Stream each suggestion to client as it's generated
			for await (const element of elementStream) {
				// @ts-expect-error todo: fix type
				const suggestion: Suggestion = {
					originalText: element.originalSentence,
					suggestedText: element.suggestedSentence,
					description: element.description,
					id: generateUUID(),
					documentId,
					isResolved: false,
				};

				dataStream.write({
					type: "data-suggestion",
					data: suggestion,
					transient: true,
				});

				suggestions.push(suggestion);
			}

			// Persist suggestions to database for later display
			if (session.user?.id) {
				const userId = session.user.id;

				await saveSuggestions({
					suggestions: suggestions.map((suggestion) => ({
						...suggestion,
						userId,
						createdAt: new Date(),
						documentCreatedAt: document.createdAt,
					})),
				});
			}

			return {
				id: documentId,
				title: document.title,
				kind: document.kind,
				message: "Suggestions have been added to the document",
			};
		},
	});
