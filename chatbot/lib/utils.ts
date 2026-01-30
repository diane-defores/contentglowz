/**
 * Core Utility Functions
 *
 * Shared utilities used across the application for:
 * - CSS class composition (cn)
 * - Data fetching with error handling
 * - UUID generation
 * - Message format conversion
 */
import type {
  UIMessage,
  UIMessagePart,
} from 'ai';

// Types for internal message processing (compatible with AI SDK message structures)
type CoreAssistantMessage = { role: 'assistant'; content: any };
type CoreToolMessage = { role: 'tool'; content: any };
import { type ClassValue, clsx } from 'clsx';
import { formatISO } from 'date-fns';
import { twMerge } from 'tailwind-merge';
import type { DBMessage, Document } from '@/lib/db/schema';
import { ChatSDKError, type ErrorCode } from './errors';
import type { ChatMessage, ChatTools, CustomUIDataTypes } from './types';

/** Merges Tailwind CSS classes with conflict resolution */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * SWR-compatible fetcher with structured error handling.
 * Parses error responses into ChatSDKError for consistent handling.
 */
export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const { code, cause } = await response.json();
    throw new ChatSDKError(code as ErrorCode, cause);
  }

  return response.json();
};

/**
 * Fetch wrapper with comprehensive error handling.
 * Detects offline state and converts API errors to ChatSDKError.
 * Used by the chat transport layer for all API calls.
 */
export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const { code, cause } = await response.json();
      throw new ChatSDKError(code as ErrorCode, cause);
    }

    return response;
  } catch (error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatSDKError('offline:chat');
    }

    throw error;
  }
}

/** Safely reads from localStorage with SSR protection */
export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

/**
 * Generates RFC 4122 v4 compliant UUIDs.
 * Used for message IDs, document IDs, and stream IDs.
 * IMPORTANT: Consistent UUID generation prevents hydration mismatches.
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Internal types for message processing
type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

/** Extracts the most recent user message from a conversation */
export function getMostRecentUserMessage(messages: UIMessage[]) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

/**
 * Retrieves document timestamp for version navigation.
 * Returns current date as fallback for safety.
 */
export function getDocumentTimestampByIndex(
  documents: Document[],
  index: number,
) {
  if (!documents) { return new Date(); }
  if (index > documents.length) { return new Date(); }

  return documents[index].createdAt;
}

/** Gets the ID of the last message in a response for continuation */
export function getTrailingMessageId({
  messages,
}: {
  messages: ResponseMessage[];
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) { return null; }

  return trailingMessage.id;
}

/** Removes internal AI markers from text content */
export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}

/**
 * Converts database message records to UI-ready format.
 * Maps the stored `parts` JSON array to typed UIMessagePart array.
 */
export function convertToUIMessages(messages: DBMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as 'user' | 'assistant' | 'system',
    parts: message.parts as UIMessagePart<CustomUIDataTypes, ChatTools>[],
    metadata: {
      createdAt: formatISO(message.createdAt),
    },
  }));
}

/** Extracts plain text content from a message's parts array */
export function getTextFromMessage(message: ChatMessage | UIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => (part as { type: 'text'; text: string}).text)
    .join('');
}
