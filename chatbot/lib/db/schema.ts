/**
 * Database Schema Definitions for Turso (libSQL/SQLite)
 *
 * Converted from PostgreSQL schema to SQLite.
 * The schema uses a message parts pattern where each message contains
 * a JSON array of typed parts (text, tool calls, etc.).
 */
import type { InferSelectModel } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import type { AppUsage } from "../usage";

/** User accounts - supports both guest and registered users */
export const user = sqliteTable("User", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  password: text("password"),
});

export type User = InferSelectModel<typeof user>;

/**
 * Chat sessions - each represents a conversation thread.
 * lastContext stores the most recent usage/cost data for display.
 */
export const chat = sqliteTable("Chat", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  title: text("title").notNull(),
  userId: text("userId").notNull().references(() => user.id),
  visibility: text("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
  lastContext: text("lastContext", { mode: "json" }).$type<AppUsage | null>(),
});

export type Chat = InferSelectModel<typeof chat>;

/**
 * @deprecated Legacy message schema - DO NOT USE for new code.
 * Kept for backward compatibility during migration period.
 */
export const messageDeprecated = sqliteTable("Message", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  chatId: text("chatId").notNull().references(() => chat.id),
  role: text("role").notNull(),
  content: text("content", { mode: "json" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

/**
 * Current message schema with parts-based structure.
 * Each message contains:
 * - parts: JSON array of typed content (text, tool-call, tool-result, etc.)
 * - attachments: JSON array of file attachments (images, documents)
 */
export const message = sqliteTable("Message_v2", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  chatId: text("chatId").notNull().references(() => chat.id),
  role: text("role").notNull(),
  parts: text("parts", { mode: "json" }).notNull(),
  attachments: text("attachments", { mode: "json" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

/**
 * @deprecated Legacy vote schema - DO NOT USE for new code.
 */
export const voteDeprecated = sqliteTable(
  "Vote",
  {
    chatId: text("chatId").notNull().references(() => chat.id),
    messageId: text("messageId").notNull().references(() => messageDeprecated.id),
    isUpvoted: integer("isUpvoted", { mode: "boolean" }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.messageId] }),
  })
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

/** User feedback on AI messages (thumbs up/down) */
export const vote = sqliteTable(
  "Vote_v2",
  {
    chatId: text("chatId").notNull().references(() => chat.id),
    messageId: text("messageId").notNull().references(() => message.id),
    isUpvoted: integer("isUpvoted", { mode: "boolean" }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.messageId] }),
  })
);

export type Vote = InferSelectModel<typeof vote>;

/**
 * AI-generated documents/artifacts.
 * Uses composite primary key (id, createdAt) to support version history -
 * each save creates a new row with the same id but different timestamp.
 */
export const document = sqliteTable(
  "Document",
  {
    id: text("id").notNull().$defaultFn(() => crypto.randomUUID()),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: text("kind", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    userId: text("userId").notNull().references(() => user.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id, table.createdAt] }),
  })
);

export type Document = InferSelectModel<typeof document>;

/**
 * Suggestions for messages.
 * Supports many-to-many relationship with messages via messageSuggestions junction table.
 */
export const suggestion = sqliteTable("Suggestion", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  documentId: text("documentId").notNull(),
  documentCreatedAt: integer("documentCreatedAt", { mode: "timestamp" }).notNull(),
  originalText: text("originalText").notNull(),
  suggestedText: text("suggestedText").notNull(),
  description: text("description"),
  isResolved: integer("isResolved", { mode: "boolean" }).notNull().default(false),
  userId: text("userId").notNull().references(() => user.id),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export type Suggestion = InferSelectModel<typeof suggestion>;

/**
 * Junction table linking messages to suggestions.
 * Enables many-to-many relationship between messages and suggestions.
 */
export const messageSuggestions = sqliteTable(
  "MessageSuggestion",
  {
    messageId: text("messageId").notNull().references(() => message.id),
    suggestionId: text("suggestionId").notNull().references(() => suggestion.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.messageId, table.suggestionId] }),
  })
);

export type MessageSuggestion = InferSelectModel<typeof messageSuggestions>;

/**
 * Stream tracking for resumable streams.
 * Stores stream IDs associated with chats for reconnection after disconnects.
 */
export const stream = sqliteTable("Stream", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  chatId: text("chatId").notNull().references(() => chat.id),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export type Stream = InferSelectModel<typeof stream>;
