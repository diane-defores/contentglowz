/**
 * Chat Server Actions
 *
 * Server-side mutations for chat operations.
 * These are called from client components using Next.js Server Actions.
 *
 * Naming convention: verb + Noun (e.g., saveChatModelAsCookie)
 */
"use server";

import { generateText, type UIMessage } from "ai";
import { cookies } from "next/headers";
import type { VisibilityType } from "@/components/visibility-selector";
import { titlePrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisibilityById,
} from "@/lib/db/queries";
import { getTextFromMessage } from "@/lib/utils";

/** Persists user's model preference in a cookie for next session */
export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

/**
 * Generates a concise title from the first user message.
 * Called when a new chat is created to provide a meaningful sidebar label.
 */
export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  const { text: title } = await generateText({
    model: myProvider.languageModel("title-model"),
    system: titlePrompt,
    prompt: getTextFromMessage(message),
  });

  return title;
}

/**
 * Deletes messages that follow a specific message (for message editing).
 * When a user edits a message, all subsequent messages become invalid
 * and must be removed before regenerating.
 */
export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

/** Updates chat visibility (private/public) for sharing */
export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisibilityById({ chatId, visibility });
}
