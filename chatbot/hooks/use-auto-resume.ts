/**
 * Auto-Resume Hook for Streaming Reconnection
 *
 * Handles automatic resumption of interrupted chat streams.
 * When the page loads and the last message was from the user (indicating
 * an interrupted AI response), this hook triggers stream resumption.
 *
 * Also handles appending messages from the data stream (for resume scenarios).
 */
"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useEffect } from "react";
import { useDataStream } from "@/components/data-stream-provider";
import type { ChatMessage } from "@/lib/types";

export type UseAutoResumeParams = {
	/** Whether auto-resume is enabled for this chat */
	autoResume: boolean;
	/** Initial messages loaded from database */
	initialMessages: ChatMessage[];
	/** Function to resume an interrupted stream */
	resumeStream: UseChatHelpers<ChatMessage>["resumeStream"];
	/** Function to update the message list */
	setMessages: UseChatHelpers<ChatMessage>["setMessages"];
};

export function useAutoResume({
	autoResume,
	initialMessages,
	resumeStream,
	setMessages,
}: UseAutoResumeParams) {
	const { dataStream } = useDataStream();

	/**
	 * Check if we should resume on mount.
	 * If the last message was from the user, the AI response was interrupted
	 * and we should attempt to resume the stream.
	 */
	useEffect(() => {
		if (!autoResume) {
			return;
		}

		const mostRecentMessage = initialMessages.at(-1);

		if (mostRecentMessage?.role === "user") {
			resumeStream();
		}

		// we intentionally run this once
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [autoResume, initialMessages.at, resumeStream]);

	/**
	 * Handle appendMessage data parts from resumed streams.
	 * When resuming, the server may send messages that should be appended
	 * to the existing message list.
	 */
	useEffect(() => {
		if (!dataStream) {
			return;
		}
		if (dataStream.length === 0) {
			return;
		}

		const dataPart = dataStream[0];

		if (dataPart.type === "data-appendMessage") {
			const message = JSON.parse(dataPart.data);
			setMessages([...initialMessages, message]);
		}
	}, [dataStream, initialMessages, setMessages]);
}
