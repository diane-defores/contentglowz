"use client";

/**
 * ChatActionsContext
 * Exposes sendMessage to deep child components (e.g. validation cards)
 * without prop-drilling through the full message render tree.
 */
import { createContext, useContext } from "react";

type SendMessageFn = (message: { role: "user"; content: string }) => void;

export const ChatActionsContext = createContext<{
  sendMessage: SendMessageFn | null;
}>({ sendMessage: null });

export function useChatActions() {
  return useContext(ChatActionsContext);
}
