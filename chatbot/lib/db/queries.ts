/**
 * Database Query Layer
 *
 * Centralized data access functions using Drizzle ORM.
 * All queries throw ChatSDKError for consistent error handling.
 *
 * Naming convention: verb + By + FilterField
 * (e.g., getMessageById, deleteMessagesByChatIdAfterTimestamp)
 */
import "server-only";

import {
	and,
	asc,
	count,
	desc,
	eq,
	gt,
	gte,
	inArray,
	lt,
	type SQL,
} from "drizzle-orm";
import type { ArtifactKind } from "@/components/artifact";
import type { VisibilityType } from "@/components/visibility-selector";
import { ChatSDKError } from "../errors";
import type { AppUsage } from "../usage";
import { generateUUID } from "../utils";
import { getDb } from "./client";
import {
	type ActivityLog,
	activityLog,
	type AffiliateLink,
	affiliateLink,
	type Chat,
	chat,
	type Competitor,
	competitor,
	type DBMessage,
	document,
	message,
	type Project,
	project,
	type Suggestion,
	stream,
	suggestion,
	type User,
	user,
	type UserSettings,
	userSettings,
	vote,
} from "./schema";
import { generateHashedPassword } from "./utils";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

/** Get database instance from client */
const db = getDb();

// ============================================================================
// User Queries
// ============================================================================

/** Retrieves user by email for authentication */
export async function getUser(email: string): Promise<User[]> {
	try {
		return await db.select().from(user).where(eq(user.email, email));
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get user by email",
		);
	}
}

/** Creates a new registered user with hashed password */
export async function createUser(email: string, password: string) {
	const hashedPassword = generateHashedPassword(password);

	try {
		return await db.insert(user).values({ email, password: hashedPassword });
	} catch (_error) {
		throw new ChatSDKError("bad_request:database", "Failed to create user");
	}
}

/**
 * Creates an ephemeral guest user with generated credentials.
 * Guest users are identified by email pattern: guest-{timestamp}
 */
export async function createGuestUser() {
	const email = `guest-${Date.now()}`;
	const password = generateHashedPassword(generateUUID());

	try {
		console.log("🔍 Creating guest user:", email);
		const result = await db.insert(user).values({ email, password }).returning({
			id: user.id,
			email: user.email,
		});
		console.log("✅ Guest user created:", result);
		return result;
	} catch (_error) {
		console.error("❌ createGuestUser error:", _error);
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to create guest user",
		);
	}
}

// ============================================================================
// Chat Queries
// ============================================================================

/** Creates a new chat session */
export async function saveChat({
	id,
	userId,
	projectId,
	title,
	visibility,
}: {
	id: string;
	userId: string;
	projectId?: string;
	title: string;
	visibility: VisibilityType;
}) {
	try {
		return await db.insert(chat).values({
			id,
			createdAt: new Date(),
			userId,
			projectId,
			title,
			visibility,
		});
	} catch (_error) {
		throw new ChatSDKError("bad_request:database", "Failed to save chat");
	}
}

/**
 * Deletes a chat and all associated data.
 * Order matters: votes → messages → streams → chat (foreign key constraints)
 */
export async function deleteChatById({ id }: { id: string }) {
	try {
		await db.delete(vote).where(eq(vote.chatId, id));
		await db.delete(message).where(eq(message.chatId, id));
		await db.delete(stream).where(eq(stream.chatId, id));

		const [chatsDeleted] = await db
			.delete(chat)
			.where(eq(chat.id, id))
			.returning();
		return chatsDeleted;
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to delete chat by id",
		);
	}
}

/** Deletes all chats for a user (for account cleanup) */
export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
	try {
		const userChats = await db
			.select({ id: chat.id })
			.from(chat)
			.where(eq(chat.userId, userId));

		if (userChats.length === 0) {
			return { deletedCount: 0 };
		}

		const chatIds = userChats.map((c) => c.id);

		await db.delete(vote).where(inArray(vote.chatId, chatIds));
		await db.delete(message).where(inArray(message.chatId, chatIds));
		await db.delete(stream).where(inArray(stream.chatId, chatIds));

		const deletedChats = await db
			.delete(chat)
			.where(eq(chat.userId, userId))
			.returning();

		return { deletedCount: deletedChats.length };
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to delete all chats by user id",
		);
	}
}

/**
 * Paginated chat history for sidebar.
 * Uses cursor-based pagination via startingAfter/endingBefore for efficient navigation.
 * Returns one extra item to detect hasMore without additional query.
 */
export async function getChatsByUserId({
	id,
	projectId,
	limit,
	startingAfter,
	endingBefore,
}: {
	id: string;
	projectId?: string;
	limit: number;
	startingAfter: string | null;
	endingBefore: string | null;
}) {
	try {
		const extendedLimit = limit + 1;

		const baseConditions = projectId
			? and(eq(chat.userId, id), eq(chat.projectId, projectId))
			: eq(chat.userId, id);

		const query = (whereCondition?: SQL<any>) =>
			db
				.select()
				.from(chat)
				.where(
					whereCondition
						? and(whereCondition, baseConditions)
						: baseConditions,
				)
				.orderBy(desc(chat.createdAt))
				.limit(extendedLimit);

		let filteredChats: Chat[] = [];

		if (startingAfter) {
			const [selectedChat] = await db
				.select()
				.from(chat)
				.where(eq(chat.id, startingAfter))
				.limit(1);

			if (!selectedChat) {
				throw new ChatSDKError(
					"not_found:database",
					`Chat with id ${startingAfter} not found`,
				);
			}

			filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
		} else if (endingBefore) {
			const [selectedChat] = await db
				.select()
				.from(chat)
				.where(eq(chat.id, endingBefore))
				.limit(1);

			if (!selectedChat) {
				throw new ChatSDKError(
					"not_found:database",
					`Chat with id ${endingBefore} not found`,
				);
			}

			filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
		} else {
			filteredChats = await query();
		}

		const hasMore = filteredChats.length > limit;

		return {
			chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
			hasMore,
		};
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get chats by user id",
		);
	}
}

/** Retrieves a single chat by ID, returns null if not found */
export async function getChatById({ id }: { id: string }) {
	try {
		const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
		if (!selectedChat) {
			return null;
		}

		return selectedChat;
	} catch (_error) {
		throw new ChatSDKError("bad_request:database", "Failed to get chat by id");
	}
}

// ============================================================================
// Message Queries
// ============================================================================

/** Bulk inserts messages (used for saving both user and assistant messages) */
export async function saveMessages({ messages }: { messages: DBMessage[] }) {
	try {
		return await db.insert(message).values(messages);
	} catch (_error) {
		throw new ChatSDKError("bad_request:database", "Failed to save messages");
	}
}

/** Retrieves all messages for a chat in chronological order */
export async function getMessagesByChatId({ id }: { id: string }) {
	try {
		return await db
			.select()
			.from(message)
			.where(eq(message.chatId, id))
			.orderBy(asc(message.createdAt));
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get messages by chat id",
		);
	}
}

// ============================================================================
// Vote Queries
// ============================================================================

/**
 * Records or updates user feedback on a message.
 * Uses upsert pattern: updates existing vote or creates new one.
 */
export async function voteMessage({
	chatId,
	messageId,
	type,
}: {
	chatId: string;
	messageId: string;
	type: "up" | "down";
}) {
	try {
		const [existingVote] = await db
			.select()
			.from(vote)
			.where(and(eq(vote.messageId, messageId)));

		if (existingVote) {
			return await db
				.update(vote)
				.set({ isUpvoted: type === "up" })
				.where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
		}
		return await db.insert(vote).values({
			chatId,
			messageId,
			isUpvoted: type === "up",
		});
	} catch (_error) {
		throw new ChatSDKError("bad_request:database", "Failed to vote message");
	}
}

/** Gets all votes for messages in a chat (for displaying vote states) */
export async function getVotesByChatId({ id }: { id: string }) {
	try {
		return await db.select().from(vote).where(eq(vote.chatId, id));
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get votes by chat id",
		);
	}
}

// ============================================================================
// Document Queries (Artifacts)
// ============================================================================

/**
 * Saves a new document version.
 * Each save creates a new row - the composite key (id, createdAt) enables version history.
 */
export async function saveDocument({
	id,
	title,
	kind,
	content,
	userId,
}: {
	id: string;
	title: string;
	kind: ArtifactKind;
	content: string;
	userId: string;
}) {
	try {
		return await db
			.insert(document)
			.values({
				id,
				title,
				kind,
				content,
				userId,
				createdAt: new Date(),
			})
			.returning();
	} catch (_error) {
		throw new ChatSDKError("bad_request:database", "Failed to save document");
	}
}

/** Gets all versions of a document in chronological order (for version history) */
export async function getDocumentsById({ id }: { id: string }) {
	try {
		const documents = await db
			.select()
			.from(document)
			.where(eq(document.id, id))
			.orderBy(asc(document.createdAt));

		return documents;
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get documents by id",
		);
	}
}

/** Gets the most recent version of a document */
export async function getDocumentById({ id }: { id: string }) {
	try {
		const [selectedDocument] = await db
			.select()
			.from(document)
			.where(eq(document.id, id))
			.orderBy(desc(document.createdAt));

		return selectedDocument;
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get document by id",
		);
	}
}

/**
 * Deletes document versions created after a timestamp.
 * Used for "undo" functionality - removes newer versions to restore earlier state.
 */
export async function deleteDocumentsByIdAfterTimestamp({
	id,
	timestamp,
}: {
	id: string;
	timestamp: Date;
}) {
	try {
		await db
			.delete(suggestion)
			.where(
				and(
					eq(suggestion.documentId, id),
					gt(suggestion.documentCreatedAt, timestamp),
				),
			);

		return await db
			.delete(document)
			.where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
			.returning();
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to delete documents by id after timestamp",
		);
	}
}

// ============================================================================
// Suggestion Queries
// ============================================================================

/** Bulk saves AI-generated suggestions for a document */
export async function saveSuggestions({
	suggestions,
}: {
	suggestions: Suggestion[];
}) {
	try {
		return await db.insert(suggestion).values(suggestions);
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to save suggestions",
		);
	}
}

/** Gets all suggestions for a document (for inline suggestion UI) */
export async function getSuggestionsByDocumentId({
	documentId,
}: {
	documentId: string;
}) {
	try {
		return await db
			.select()
			.from(suggestion)
			.where(eq(suggestion.documentId, documentId));
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get suggestions by document id",
		);
	}
}

// ============================================================================
// Message Management Queries
// ============================================================================

/** Gets a single message by ID */
export async function getMessageById({ id }: { id: string }) {
	try {
		return await db.select().from(message).where(eq(message.id, id));
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get message by id",
		);
	}
}

/**
 * Deletes messages from a point in time forward.
 * Used for message editing - when user edits a message, all subsequent messages are removed.
 */
export async function deleteMessagesByChatIdAfterTimestamp({
	chatId,
	timestamp,
}: {
	chatId: string;
	timestamp: Date;
}) {
	try {
		const messagesToDelete = await db
			.select({ id: message.id })
			.from(message)
			.where(
				and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
			);

		const messageIds = messagesToDelete.map(
			(currentMessage) => currentMessage.id,
		);

		if (messageIds.length > 0) {
			await db
				.delete(vote)
				.where(
					and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
				);

			return await db
				.delete(message)
				.where(
					and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
				);
		}
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to delete messages by chat id after timestamp",
		);
	}
}

// ============================================================================
// Chat Settings Queries
// ============================================================================

/** Updates chat visibility (private/public) */
export async function updateChatVisibilityById({
	chatId,
	visibility,
}: {
	chatId: string;
	visibility: "private" | "public";
}) {
	try {
		return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to update chat visibility by id",
		);
	}
}

/**
 * Stores the most recent usage/cost data for a chat.
 * This is displayed in the UI and persisted for analytics.
 */
export async function updateChatLastContextById({
	chatId,
	context,
}: {
	chatId: string;
	// Store merged server-enriched usage object
	context: AppUsage;
}) {
	try {
		return await db
			.update(chat)
			.set({ lastContext: context })
			.where(eq(chat.id, chatId));
	} catch (error) {
		console.warn("Failed to update lastContext for chat", chatId, error);
		return;
	}
}

// ============================================================================
// Rate Limiting Queries
// ============================================================================

/**
 * Counts user messages within a time window for rate limiting.
 * Only counts user-role messages (not assistant responses) within the specified hours.
 */
export async function getMessageCountByUserId({
	id,
	differenceInHours,
}: {
	id: string;
	differenceInHours: number;
}) {
	try {
		const twentyFourHoursAgo = new Date(
			Date.now() - differenceInHours * 60 * 60 * 1000,
		);

		const [stats] = await db
			.select({ count: count(message.id) })
			.from(message)
			.innerJoin(chat, eq(message.chatId, chat.id))
			.where(
				and(
					eq(chat.userId, id),
					gte(message.createdAt, twentyFourHoursAgo),
					eq(message.role, "user"),
				),
			)
			.execute();

		return stats?.count ?? 0;
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get message count by user id",
		);
	}
}

// ============================================================================
// Stream Tracking Queries (Resumable Streams)
// ============================================================================

/**
 * Registers a new stream for potential resumption.
 * Used with Redis-backed resumable streams for connection recovery.
 */
export async function createStreamId({
	streamId,
	chatId,
}: {
	streamId: string;
	chatId: string;
}) {
	try {
		await db
			.insert(stream)
			.values({ id: streamId, chatId, createdAt: new Date() });
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to create stream id",
		);
	}
}

/** Gets all stream IDs for a chat (for resumption after disconnect) */
export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
	try {
		const streamIds = await db
			.select({ id: stream.id })
			.from(stream)
			.where(eq(stream.chatId, chatId))
			.orderBy(asc(stream.createdAt))
			.execute();

		return streamIds.map(({ id }) => id);
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get stream ids by chat id",
		);
	}
}

// ============================================================================
// Affiliate Link Queries
// ============================================================================

/** Gets all affiliate links for a user, optionally filtered by project */
export async function getAffiliationsByUserId({
	userId,
	projectId,
}: {
	userId: string;
	projectId?: string;
}): Promise<AffiliateLink[]> {
	try {
		const conditions = [eq(affiliateLink.userId, userId)];
		if (projectId) {
			conditions.push(eq(affiliateLink.projectId, projectId));
		}
		return await db
			.select()
			.from(affiliateLink)
			.where(and(...conditions))
			.orderBy(desc(affiliateLink.createdAt));
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get affiliate links by user id",
		);
	}
}

/** Gets active affiliate links for a user (for AI tool), optionally filtered by project */
export async function getActiveAffiliationsByUserId({
	userId,
	projectId,
}: {
	userId: string;
	projectId?: string;
}): Promise<AffiliateLink[]> {
	try {
		const conditions = [
			eq(affiliateLink.userId, userId),
			eq(affiliateLink.status, "active"),
		];
		if (projectId) {
			conditions.push(eq(affiliateLink.projectId, projectId));
		}
		return await db
			.select()
			.from(affiliateLink)
			.where(and(...conditions))
			.orderBy(desc(affiliateLink.createdAt));
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get active affiliate links",
		);
	}
}

/** Gets a single affiliate link by ID */
export async function getAffiliationById({
	id,
}: {
	id: string;
}): Promise<AffiliateLink | null> {
	try {
		const [link] = await db
			.select()
			.from(affiliateLink)
			.where(eq(affiliateLink.id, id));
		return link || null;
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get affiliate link by id",
		);
	}
}

/** Creates a new affiliate link */
export async function createAffiliation({
	userId,
	projectId,
	name,
	url,
	category,
	commission,
	keywords,
	status,
	notes,
	expiresAt,
}: {
	userId: string;
	projectId?: string;
	name: string;
	url: string;
	category?: string;
	commission?: string;
	keywords?: string[];
	status?: "active" | "expired" | "paused";
	notes?: string;
	expiresAt?: Date;
}): Promise<AffiliateLink> {
	try {
		const [created] = await db
			.insert(affiliateLink)
			.values({
				userId,
				projectId,
				name,
				url,
				category,
				commission,
				keywords,
				status: status || "active",
				notes,
				expiresAt,
			})
			.returning();
		return created;
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to create affiliate link",
		);
	}
}

/** Updates an affiliate link */
export async function updateAffiliation({
	id,
	name,
	url,
	category,
	commission,
	keywords,
	status,
	notes,
	expiresAt,
}: {
	id: string;
	name?: string;
	url?: string;
	category?: string;
	commission?: string;
	keywords?: string[];
	status?: "active" | "expired" | "paused";
	notes?: string;
	expiresAt?: Date | null;
}): Promise<AffiliateLink> {
	try {
		const updateData: Record<string, any> = {
			updatedAt: new Date(),
		};
		if (name !== undefined) updateData.name = name;
		if (url !== undefined) updateData.url = url;
		if (category !== undefined) updateData.category = category;
		if (commission !== undefined) updateData.commission = commission;
		if (keywords !== undefined) updateData.keywords = keywords;
		if (status !== undefined) updateData.status = status;
		if (notes !== undefined) updateData.notes = notes;
		if (expiresAt !== undefined) updateData.expiresAt = expiresAt;

		const [updated] = await db
			.update(affiliateLink)
			.set(updateData)
			.where(eq(affiliateLink.id, id))
			.returning();
		return updated;
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to update affiliate link",
		);
	}
}

/** Deletes an affiliate link */
export async function deleteAffiliation({ id }: { id: string }) {
	try {
		await db.delete(affiliateLink).where(eq(affiliateLink.id, id));
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to delete affiliate link",
		);
	}
}

// ============================================================================
// Competitor Queries
// ============================================================================

/** Gets all competitors for a user, optionally filtered by project */
export async function getCompetitorsByUserId({
	userId,
	projectId,
}: {
	userId: string;
	projectId?: string;
}): Promise<Competitor[]> {
	try {
		const conditions = [eq(competitor.userId, userId)];
		if (projectId) {
			conditions.push(eq(competitor.projectId, projectId));
		}
		return await db
			.select()
			.from(competitor)
			.where(and(...conditions))
			.orderBy(desc(competitor.createdAt));
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get competitors by user id",
		);
	}
}

/** Gets a single competitor by ID */
export async function getCompetitorById({
	id,
}: {
	id: string;
}): Promise<Competitor | null> {
	try {
		const [comp] = await db
			.select()
			.from(competitor)
			.where(eq(competitor.id, id));
		return comp || null;
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get competitor by id",
		);
	}
}

/** Creates a new competitor */
export async function createCompetitor({
	userId,
	projectId,
	name,
	url,
	niche,
	priority,
	notes,
}: {
	userId: string;
	projectId?: string;
	name: string;
	url: string;
	niche?: string;
	priority?: "high" | "medium" | "low";
	notes?: string;
}): Promise<Competitor> {
	try {
		const [created] = await db
			.insert(competitor)
			.values({
				userId,
				projectId,
				name,
				url,
				niche,
				priority: priority || "medium",
				notes,
			})
			.returning();
		return created;
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to create competitor",
		);
	}
}

/** Updates a competitor */
export async function updateCompetitor({
	id,
	name,
	url,
	niche,
	priority,
	notes,
	lastAnalyzedAt,
	analysisData,
}: {
	id: string;
	name?: string;
	url?: string;
	niche?: string;
	priority?: "high" | "medium" | "low";
	notes?: string;
	lastAnalyzedAt?: Date;
	analysisData?: Competitor["analysisData"];
}): Promise<Competitor> {
	try {
		const updateData: Record<string, any> = {};
		if (name !== undefined) updateData.name = name;
		if (url !== undefined) updateData.url = url;
		if (niche !== undefined) updateData.niche = niche;
		if (priority !== undefined) updateData.priority = priority;
		if (notes !== undefined) updateData.notes = notes;
		if (lastAnalyzedAt !== undefined) updateData.lastAnalyzedAt = lastAnalyzedAt;
		if (analysisData !== undefined) updateData.analysisData = analysisData;

		const [updated] = await db
			.update(competitor)
			.set(updateData)
			.where(eq(competitor.id, id))
			.returning();
		return updated;
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to update competitor",
		);
	}
}

/** Deletes a competitor */
export async function deleteCompetitor({ id }: { id: string }) {
	try {
		await db.delete(competitor).where(eq(competitor.id, id));
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to delete competitor",
		);
	}
}

// ============================================================================
// Project Queries
// ============================================================================

/** Gets all projects for a user */
export async function getProjectsByUserId({
	userId,
}: {
	userId: string;
}): Promise<Project[]> {
	try {
		return await db
			.select()
			.from(project)
			.where(eq(project.userId, userId))
			.orderBy(desc(project.createdAt));
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get projects by user id",
		);
	}
}

/** Gets the default project for a user */
export async function getDefaultProjectByUserId({
	userId,
}: {
	userId: string;
}): Promise<Project | null> {
	try {
		const [proj] = await db
			.select()
			.from(project)
			.where(and(eq(project.userId, userId), eq(project.isDefault, true)));
		return proj || null;
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get default project",
		);
	}
}

/** Gets a single project by ID */
export async function getProjectById({
	id,
}: {
	id: string;
}): Promise<Project | null> {
	try {
		const [proj] = await db.select().from(project).where(eq(project.id, id));
		return proj || null;
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get project by id",
		);
	}
}

/** Creates a new project */
export async function createProject({
	userId,
	name,
	url,
	type,
	description,
	isDefault,
	settings,
}: {
	userId: string;
	name: string;
	url: string;
	type?: "github" | "website";
	description?: string;
	isDefault?: boolean;
	settings?: Project["settings"];
}): Promise<Project> {
	try {
		// If this is the default, unset other defaults first
		if (isDefault) {
			await db
				.update(project)
				.set({ isDefault: false })
				.where(eq(project.userId, userId));
		}

		const [created] = await db
			.insert(project)
			.values({
				userId,
				name,
				url,
				type: type || "github",
				description,
				isDefault: isDefault || false,
				settings,
			})
			.returning();
		return created;
	} catch (_error) {
		throw new ChatSDKError("bad_request:database", "Failed to create project");
	}
}

/** Updates a project */
export async function updateProject({
	id,
	name,
	url,
	type,
	description,
	isDefault,
	settings,
	lastAnalyzedAt,
}: {
	id: string;
	name?: string;
	url?: string;
	type?: "github" | "website";
	description?: string;
	isDefault?: boolean;
	settings?: Project["settings"];
	lastAnalyzedAt?: Date;
}): Promise<Project> {
	try {
		// If setting as default, unset other defaults first
		if (isDefault) {
			const [existingProject] = await db
				.select({ userId: project.userId })
				.from(project)
				.where(eq(project.id, id));
			if (existingProject) {
				await db
					.update(project)
					.set({ isDefault: false })
					.where(eq(project.userId, existingProject.userId));
			}
		}

		const updateData: Record<string, any> = {};
		if (name !== undefined) updateData.name = name;
		if (url !== undefined) updateData.url = url;
		if (type !== undefined) updateData.type = type;
		if (description !== undefined) updateData.description = description;
		if (isDefault !== undefined) updateData.isDefault = isDefault;
		if (settings !== undefined) updateData.settings = settings;
		if (lastAnalyzedAt !== undefined) updateData.lastAnalyzedAt = lastAnalyzedAt;

		const [updated] = await db
			.update(project)
			.set(updateData)
			.where(eq(project.id, id))
			.returning();
		return updated;
	} catch (_error) {
		throw new ChatSDKError("bad_request:database", "Failed to update project");
	}
}

/** Deletes a project */
export async function deleteProject({ id }: { id: string }) {
	try {
		// Delete associated activity logs first
		await db.delete(activityLog).where(eq(activityLog.projectId, id));
		await db.delete(project).where(eq(project.id, id));
	} catch (_error) {
		throw new ChatSDKError("bad_request:database", "Failed to delete project");
	}
}

// ============================================================================
// Activity Log Queries
// ============================================================================

/** Gets activity logs for a user with optional filters */
export async function getActivityLogsByUserId({
	userId,
	projectId,
	robotId,
	status,
	limit = 50,
}: {
	userId: string;
	projectId?: string;
	robotId?: string;
	status?: ActivityLog["status"];
	limit?: number;
}): Promise<ActivityLog[]> {
	try {
		const conditions = [eq(activityLog.userId, userId)];
		if (projectId) conditions.push(eq(activityLog.projectId, projectId));
		if (robotId) conditions.push(eq(activityLog.robotId, robotId));
		if (status) conditions.push(eq(activityLog.status, status));

		return await db
			.select()
			.from(activityLog)
			.where(and(...conditions))
			.orderBy(desc(activityLog.createdAt))
			.limit(limit);
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get activity logs",
		);
	}
}

/** Gets a single activity log by ID */
export async function getActivityLogById({
	id,
}: {
	id: string;
}): Promise<ActivityLog | null> {
	try {
		const [log] = await db
			.select()
			.from(activityLog)
			.where(eq(activityLog.id, id));
		return log || null;
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get activity log by id",
		);
	}
}

/** Creates a new activity log entry */
export async function createActivityLog({
	userId,
	projectId,
	action,
	robotId,
	status,
	details,
}: {
	userId: string;
	projectId?: string;
	action: string;
	robotId?: string;
	status?: ActivityLog["status"];
	details?: ActivityLog["details"];
}): Promise<ActivityLog> {
	try {
		const [created] = await db
			.insert(activityLog)
			.values({
				userId,
				projectId,
				action,
				robotId,
				status: status || "started",
				details,
			})
			.returning();
		return created;
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to create activity log",
		);
	}
}

/** Updates an activity log (typically to mark completion or failure) */
export async function updateActivityLog({
	id,
	status,
	details,
	completedAt,
}: {
	id: string;
	status?: ActivityLog["status"];
	details?: ActivityLog["details"];
	completedAt?: Date;
}): Promise<ActivityLog> {
	try {
		const updateData: Record<string, any> = {};
		if (status !== undefined) updateData.status = status;
		if (details !== undefined) updateData.details = details;
		if (completedAt !== undefined) updateData.completedAt = completedAt;

		const [updated] = await db
			.update(activityLog)
			.set(updateData)
			.where(eq(activityLog.id, id))
			.returning();
		return updated;
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to update activity log",
		);
	}
}

/** Deletes old activity logs (cleanup) */
export async function deleteOldActivityLogs({
	userId,
	olderThanDays = 30,
}: {
	userId: string;
	olderThanDays?: number;
}) {
	try {
		const cutoffDate = new Date(
			Date.now() - olderThanDays * 24 * 60 * 60 * 1000,
		);
		await db
			.delete(activityLog)
			.where(
				and(
					eq(activityLog.userId, userId),
					lt(activityLog.createdAt, cutoffDate),
				),
			);
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to delete old activity logs",
		);
	}
}

// ============================================================================
// User Settings Queries
// ============================================================================

/** Gets user settings, creates default if not exists */
export async function getUserSettings({
	userId,
}: {
	userId: string;
}): Promise<UserSettings> {
	try {
		const [existing] = await db
			.select()
			.from(userSettings)
			.where(eq(userSettings.userId, userId));

		if (existing) return existing;

		// Create default settings
		const [created] = await db
			.insert(userSettings)
			.values({ userId })
			.returning();
		return created;
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to get user settings",
		);
	}
}

/** Updates user settings */
export async function updateUserSettings({
	userId,
	theme,
	language,
	emailNotifications,
	webhookUrl,
	apiKeys,
	defaultProjectId,
	dashboardLayout,
	robotSettings,
}: {
	userId: string;
	theme?: UserSettings["theme"];
	language?: string;
	emailNotifications?: boolean;
	webhookUrl?: string | null;
	apiKeys?: UserSettings["apiKeys"];
	defaultProjectId?: string | null;
	dashboardLayout?: UserSettings["dashboardLayout"];
	robotSettings?: UserSettings["robotSettings"];
}): Promise<UserSettings> {
	try {
		// Ensure settings exist
		await getUserSettings({ userId });

		const updateData: Record<string, any> = {
			updatedAt: new Date(),
		};
		if (theme !== undefined) updateData.theme = theme;
		if (language !== undefined) updateData.language = language;
		if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
		if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl;
		if (apiKeys !== undefined) updateData.apiKeys = apiKeys;
		if (defaultProjectId !== undefined) updateData.defaultProjectId = defaultProjectId;
		if (dashboardLayout !== undefined) updateData.dashboardLayout = dashboardLayout;
		if (robotSettings !== undefined) updateData.robotSettings = robotSettings;

		const [updated] = await db
			.update(userSettings)
			.set(updateData)
			.where(eq(userSettings.userId, userId))
			.returning();
		return updated;
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to update user settings",
		);
	}
}

/** Updates a single API key */
export async function updateUserApiKey({
	userId,
	provider,
	apiKey,
}: {
	userId: string;
	provider: "openai" | "anthropic" | "exa" | "firecrawl" | "serper" | "bunnyStorage" | "bunnyCdn" | "bunnyCdnHostname";
	apiKey: string | null;
}): Promise<UserSettings> {
	try {
		const current = await getUserSettings({ userId });
		const currentKeys = current.apiKeys || {};

		if (apiKey === null) {
			delete currentKeys[provider];
		} else {
			currentKeys[provider] = apiKey;
		}

		return await updateUserSettings({
			userId,
			apiKeys: currentKeys,
		});
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to update API key",
		);
	}
}

/** Deletes user settings (for account cleanup) */
export async function deleteUserSettings({ userId }: { userId: string }) {
	try {
		await db.delete(userSettings).where(eq(userSettings.userId, userId));
	} catch (_error) {
		throw new ChatSDKError(
			"bad_request:database",
			"Failed to delete user settings",
		);
	}
}
