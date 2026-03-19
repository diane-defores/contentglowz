"use client";

/**
 * ChatActionsContext
 * Exposes sendMessage to deep child components (e.g. validation cards)
 * without prop-drilling through the full message render tree.
 */
import type { UseChatHelpers } from "@ai-sdk/react";
import { createContext, useContext } from "react";
import type { ChatMessage } from "@/lib/types";

type SendMessageFn = UseChatHelpers<ChatMessage>["sendMessage"];

export const ChatActionsContext = createContext<{
  sendMessage: SendMessageFn | null;
}>({ sendMessage: null });

export function useChatActions() {
  return useContext(ChatActionsContext);
}
