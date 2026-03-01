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
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";
import type { AppUsage } from "../usage";

/** User accounts - supports both guest and registered users */
export const user = sqliteTable("User", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	email: text("email").notNull(),
	password: text("password"),
});

export type User = InferSelectModel<typeof user>;

/**
 * Chat sessions - each represents a conversation thread.
 * lastContext stores the most recent usage/cost data for display.
 */
export const chat = sqliteTable("Chat", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	title: text("title").notNull(),
	userId: text("userId")
		.notNull()
		.references(() => user.id),
	projectId: text("projectId"), // Links to Project.id for scoping robot runs
	visibility: text("visibility", { enum: ["public", "private"] })
		.notNull()
		.default("private"),
	type: text("type", { enum: ["chat", "research"] })
		.notNull()
		.default("chat"),
	chatStatus: text("chatStatus", { enum: ["active", "pending", "archived"] })
		.notNull()
		.default("active"),
	lastContext: text("lastContext", { mode: "json" }).$type<AppUsage | null>(),
});

export type Chat = InferSelectModel<typeof chat>;

/**
 * @deprecated Legacy message schema - DO NOT USE for new code.
 * Kept for backward compatibility during migration period.
 */
export const messageDeprecated = sqliteTable("Message", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	chatId: text("chatId")
		.notNull()
		.references(() => chat.id),
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
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	chatId: text("chatId")
		.notNull()
		.references(() => chat.id),
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
		chatId: text("chatId")
			.notNull()
			.references(() => chat.id),
		messageId: text("messageId")
			.notNull()
			.references(() => messageDeprecated.id),
		isUpvoted: integer("isUpvoted", { mode: "boolean" }).notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.chatId, table.messageId] }),
	}),
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

/** User feedback on AI messages (thumbs up/down) */
export const vote = sqliteTable(
	"Vote_v2",
	{
		chatId: text("chatId")
			.notNull()
			.references(() => chat.id),
		messageId: text("messageId")
			.notNull()
			.references(() => message.id),
		isUpvoted: integer("isUpvoted", { mode: "boolean" }).notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.chatId, table.messageId] }),
	}),
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
		id: text("id")
			.notNull()
			.$defaultFn(() => crypto.randomUUID()),
		createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
		title: text("title").notNull(),
		content: text("content"),
		kind: text("kind", { enum: ["text", "code", "image", "sheet"] })
			.notNull()
			.default("text"),
		userId: text("userId")
			.notNull()
			.references(() => user.id),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.id, table.createdAt] }),
	}),
);

export type Document = InferSelectModel<typeof document>;

/**
 * Suggestions for messages.
 * Supports many-to-many relationship with messages via messageSuggestions junction table.
 */
export const suggestion = sqliteTable("Suggestion", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	documentId: text("documentId").notNull(),
	documentCreatedAt: integer("documentCreatedAt", {
		mode: "timestamp",
	}).notNull(),
	originalText: text("originalText").notNull(),
	suggestedText: text("suggestedText").notNull(),
	description: text("description"),
	isResolved: integer("isResolved", { mode: "boolean" })
		.notNull()
		.default(false),
	userId: text("userId")
		.notNull()
		.references(() => user.id),
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
		messageId: text("messageId")
			.notNull()
			.references(() => message.id),
		suggestionId: text("suggestionId")
			.notNull()
			.references(() => suggestion.id),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.messageId, table.suggestionId] }),
	}),
);

export type MessageSuggestion = InferSelectModel<typeof messageSuggestions>;

/**
 * Stream tracking for resumable streams.
 * Stores stream IDs associated with chats for reconnection after disconnects.
 */
export const stream = sqliteTable("Stream", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	chatId: text("chatId")
		.notNull()
		.references(() => chat.id),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export type Stream = InferSelectModel<typeof stream>;

/**
 * Affiliate links for monetization.
 * Stores affiliate program information that can be used by AI
 * to include relevant affiliate links in generated content.
 */
export const affiliateLink = sqliteTable("AffiliateLink", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("userId")
		.notNull()
		.references(() => user.id),
	projectId: text("projectId"), // Links to Project.id
	name: text("name").notNull(),
	url: text("url").notNull(),
	category: text("category"), // tech, finance, lifestyle, health, etc.
	commission: text("commission"), // "5%" or "10€/sale"
	keywords: text("keywords", { mode: "json" }).$type<string[]>(), // JSON array for AI matching
	status: text("status", { enum: ["active", "expired", "paused"] })
		.notNull()
		.default("active"),
	notes: text("notes"), // Instructions for AI
	expiresAt: integer("expiresAt", { mode: "timestamp" }),
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updatedAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type AffiliateLink = InferSelectModel<typeof affiliateLink>;

/**
 * Competitor tracking for SEO analysis.
 * Stores competitor URLs and analysis data for competitive intelligence.
 */
export const competitor = sqliteTable("Competitor", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("userId")
		.notNull()
		.references(() => user.id),
	projectId: text("projectId"), // Links to Project.id
	name: text("name").notNull(),
	url: text("url").notNull(),
	niche: text("niche"),
	priority: text("priority", { enum: ["high", "medium", "low"] })
		.notNull()
		.default("medium"),
	notes: text("notes"),
	lastAnalyzedAt: integer("lastAnalyzedAt", { mode: "timestamp" }),
	analysisData: text("analysisData", { mode: "json" }).$type<{
		score?: number;
		strengths?: string[];
		weaknesses?: string[];
		keywords?: string[];
		contentGaps?: string[];
	}>(),
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type Competitor = InferSelectModel<typeof competitor>;

/**
 * Projects/Sites for SEO analysis.
 * Stores repositories or websites that users want to analyze.
 */
export const project = sqliteTable("Project", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("userId")
		.notNull()
		.references(() => user.id),
	name: text("name").notNull(),
	url: text("url").notNull(), // GitHub repo URL or website URL
	type: text("type", { enum: ["github", "website"] })
		.notNull()
		.default("github"),
	description: text("description"),
	isDefault: integer("isDefault", { mode: "boolean" })
		.notNull()
		.default(false),
	status: text("projectStatus", {
		enum: ["onboarding", "active", "paused", "archived"],
	})
		.notNull()
		.default("active"),
	settings: text("settings", { mode: "json" }).$type<{
		autoAnalyze?: boolean;
		analyzeInterval?: number; // hours
		notifications?: boolean;
	}>(),
	lastAnalyzedAt: integer("lastAnalyzedAt", { mode: "timestamp" }),
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type Project = InferSelectModel<typeof project>;

/**
 * Activity logs for tracking robot actions and analyses.
 * Provides audit trail of all operations performed.
 */
export const activityLog = sqliteTable("ActivityLog", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("userId")
		.notNull()
		.references(() => user.id),
	projectId: text("projectId")
		.references(() => project.id),
	action: text("action").notNull(), // analyze_mesh, run_robot, check_uptime, etc.
	robotId: text("robotId"), // seo, newsletter, articles, scheduler
	status: text("status", { enum: ["started", "running", "completed", "failed"] })
		.notNull()
		.default("started"),
	details: text("details", { mode: "json" }).$type<{
		input?: Record<string, unknown>;
		output?: Record<string, unknown>;
		error?: string;
		duration?: number; // ms
		metadata?: Record<string, unknown>;
	}>(),
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	completedAt: integer("completedAt", { mode: "timestamp" }),
});

export type ActivityLog = InferSelectModel<typeof activityLog>;

/**
 * User settings and preferences.
 * Stores global user preferences, API keys, and configuration.
 */
export const userSettings = sqliteTable("UserSettings", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("userId")
		.notNull()
		.unique()
		.references(() => user.id),
	// UI Preferences
	theme: text("theme", { enum: ["light", "dark", "system"] })
		.notNull()
		.default("system"),
	language: text("language").default("en"),
	// Notifications
	emailNotifications: integer("emailNotifications", { mode: "boolean" })
		.notNull()
		.default(true),
	webhookUrl: text("webhookUrl"),
	// API Keys (encrypted in production)
	apiKeys: text("apiKeys", { mode: "json" }).$type<{
		exa?: string;
		firecrawl?: string;
		serper?: string;
		openrouter?: string;
		bunnyStorage?: string;
		bunnyCdn?: string;
		bunnyCdnHostname?: string;
		consensus?: string;
		tavily?: string;
		groq?: string;
	}>(),
	// Dashboard preferences
	defaultProjectId: text("defaultProjectId"),
	dashboardLayout: text("dashboardLayout", { mode: "json" }).$type<{
		defaultTab?: string;
		collapsedSections?: string[];
		refreshInterval?: number;
	}>(),
	// Robot settings
	robotSettings: text("robotSettings", { mode: "json" }).$type<{
		autoRun?: boolean;
		schedules?: Record<string, string>; // robotId -> cron expression
		notifications?: Record<string, boolean>; // robotId -> notify on complete
	}>(),
	// Timestamps
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updatedAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type UserSettings = InferSelectModel<typeof userSettings>;

/**
 * Newsletter generators — saved newsletter configurations that can be
 * scheduled (daily/weekly/monthly) or triggered on demand.
 */
export const newsletterGenerator = sqliteTable("NewsletterGenerator", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("userId")
		.notNull()
		.references(() => user.id),
	projectId: text("projectId"),
	// Generator config (maps to NewsletterFormData)
	name: text("name").notNull(),
	topics: text("topics", { mode: "json" }).$type<string[]>(),
	targetAudience: text("targetAudience").notNull(),
	tone: text("tone", { enum: ["professional", "casual", "friendly", "educational"] })
		.notNull()
		.default("professional"),
	competitorEmails: text("competitorEmails", { mode: "json" }).$type<string[]>(),
	includeEmailInsights: integer("includeEmailInsights", { mode: "boolean" })
		.notNull()
		.default(true),
	maxSections: integer("maxSections").notNull().default(5),
	// Scheduling
	schedule: text("schedule", { enum: ["manual", "daily", "weekly", "monthly"] })
		.notNull()
		.default("manual"),
	scheduleDay: integer("scheduleDay"), // 0-6 for weekly (0=Mon), 1-28 for monthly
	scheduleTime: text("scheduleTime"), // "09:00" format
	// Status
	status: text("status", { enum: ["active", "paused"] })
		.notNull()
		.default("active"),
	lastRunAt: integer("lastRunAt", { mode: "timestamp" }),
	lastRunStatus: text("lastRunStatus", { enum: ["completed", "failed"] }),
	// Timestamps
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updatedAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type NewsletterGenerator = InferSelectModel<typeof newsletterGenerator>;

/**
 * Gmail OAuth tokens — stores access/refresh tokens for Gmail API access.
 * One token per user (for importing competitor newsletters from their inbox).
 */
export const gmailToken = sqliteTable("GmailToken", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("userId")
		.notNull()
		.references(() => user.id),
	email: text("email").notNull(),
	accessToken: text("accessToken").notNull(),
	refreshToken: text("refreshToken").notNull(),
	expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
	scope: text("scope").notNull(),
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type GmailToken = InferSelectModel<typeof gmailToken>;

/**
 * Content records — tracks content through its lifecycle from creation to publication.
 * Synced from Python status module via the sync service.
 */
export const contentRecord = sqliteTable("ContentRecord", {
	id: text("id").primaryKey().notNull(),
	title: text("title").notNull(),
	contentType: text("contentType", {
		enum: ["article", "newsletter", "seo-content", "image", "manual", "video_script"],
	}).notNull(),
	sourceRobot: text("sourceRobot", {
		enum: ["seo", "newsletter", "article", "images", "manual"],
	}).notNull(),
	status: text("status", {
		enum: [
			"todo",
			"in_progress",
			"generated",
			"pending_review",
			"approved",
			"rejected",
			"scheduled",
			"publishing",
			"published",
			"failed",
			"archived",
		],
	})
		.notNull()
		.default("todo"),
	projectId: text("projectId"),
	contentPath: text("contentPath"),
	contentPreview: text("contentPreview"),
	contentHash: text("contentHash"),
	priority: integer("priority").notNull().default(3),
	tags: text("tags", { mode: "json" }).$type<string[]>(),
	metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
	targetUrl: text("targetUrl"),
	reviewerNote: text("reviewerNote"),
	reviewedBy: text("reviewedBy"),
	currentVersion: integer("currentVersion").notNull().default(0),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
	scheduledFor: integer("scheduledFor", { mode: "timestamp" }),
	publishedAt: integer("publishedAt", { mode: "timestamp" }),
	syncedAt: integer("syncedAt", { mode: "timestamp" }),
});

export type ContentRecord = InferSelectModel<typeof contentRecord>;

/**
 * Status change audit trail — records every status transition with who/why/when.
 */
export const statusChange = sqliteTable("StatusChange", {
	id: text("id").primaryKey().notNull(),
	contentId: text("contentId")
		.notNull()
		.references(() => contentRecord.id, { onDelete: "cascade" }),
	fromStatus: text("fromStatus").notNull(),
	toStatus: text("toStatus").notNull(),
	changedBy: text("changedBy").notNull(),
	reason: text("reason"),
	timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
});

export type StatusChange = InferSelectModel<typeof statusChange>;

/**
 * Work domain records — tracks the state of each work domain (SEO, Newsletter, etc.) per project.
 */
export const workDomain = sqliteTable("WorkDomain", {
	id: text("id").primaryKey().notNull(),
	projectId: text("projectId").notNull(),
	domain: text("domain").notNull(),
	status: text("status").notNull().default("idle"),
	lastRunAt: integer("lastRunAt", { mode: "timestamp" }),
	lastRunStatus: text("lastRunStatus"),
	itemsPending: integer("itemsPending").notNull().default(0),
	itemsCompleted: integer("itemsCompleted").notNull().default(0),
	metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type WorkDomain = InferSelectModel<typeof workDomain>;

/**
 * Content bodies — stores the full markdown content with versioning.
 * Each edit creates a new version row.
 */
export const contentBody = sqliteTable("ContentBody", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	contentId: text("contentId")
		.notNull()
		.references(() => contentRecord.id, { onDelete: "cascade" }),
	body: text("body").notNull(),
	version: integer("version").notNull().default(1),
	editedBy: text("editedBy"),
	editNote: text("editNote"),
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type ContentBody = InferSelectModel<typeof contentBody>;

/**
 * Content edit history — audit trail of all content modifications.
 */
export const contentEdit = sqliteTable("ContentEdit", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	contentId: text("contentId")
		.notNull()
		.references(() => contentRecord.id, { onDelete: "cascade" }),
	editedBy: text("editedBy").notNull(),
	editNote: text("editNote"),
	previousVersion: integer("previousVersion").notNull(),
	newVersion: integer("newVersion").notNull(),
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type ContentEdit = InferSelectModel<typeof contentEdit>;

/**
 * Schedule jobs — persistent job scheduling replacing in-memory schedules.
 * Supports newsletter, SEO, and article generation on recurring schedules.
 */
export const scheduleJob = sqliteTable("ScheduleJob", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("userId")
		.notNull()
		.references(() => user.id),
	projectId: text("projectId"),
	jobType: text("jobType", {
		enum: ["newsletter", "seo", "article"],
	}).notNull(),
	generatorId: text("generatorId"),
	configuration: text("configuration", { mode: "json" }).$type<Record<string, unknown>>(),
	schedule: text("schedule", {
		enum: ["daily", "weekly", "monthly", "custom"],
	}).notNull(),
	cronExpression: text("cronExpression"),
	scheduleDay: integer("scheduleDay"),
	scheduleTime: text("scheduleTime"),
	timezone: text("timezone").notNull().default("UTC"),
	enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
	lastRunAt: integer("lastRunAt", { mode: "timestamp" }),
	lastRunStatus: text("lastRunStatus", {
		enum: ["completed", "failed", "running"],
	}),
	nextRunAt: integer("nextRunAt", { mode: "timestamp" }),
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updatedAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type ScheduleJob = InferSelectModel<typeof scheduleJob>;

/**
 * Content templates — reusable structured data models for content generation.
 * Each template defines a content type (article, newsletter, video script, etc.)
 * with ordered sections, each having its own AI prompt configuration.
 */
export const contentTemplate = sqliteTable("ContentTemplate", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("userId")
		.notNull()
		.references(() => user.id),
	projectId: text("projectId"),
	name: text("name").notNull(),
	slug: text("slug").notNull(),
	contentType: text("contentType", {
		enum: ["article", "newsletter", "video_script", "seo_brief"],
	}).notNull(),
	description: text("description"),
	isSystem: integer("isSystem", { mode: "boolean" })
		.notNull()
		.default(false),
	version: integer("version").notNull().default(1),
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updatedAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type ContentTemplate = InferSelectModel<typeof contentTemplate>;

/**
 * Template sections — ordered fields within a content template.
 * Each section has its own prompt (AI-generated default + optional user override)
 * and generation hints (model, temperature, max tokens, style).
 */
export const templateSection = sqliteTable("TemplateSection", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	templateId: text("templateId")
		.notNull()
		.references(() => contentTemplate.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	label: text("label").notNull(),
	fieldType: text("fieldType", {
		enum: ["text", "markdown", "list", "number", "url", "tags", "image"],
	}).notNull(),
	required: integer("required", { mode: "boolean" })
		.notNull()
		.default(true),
	order: integer("order").notNull().default(0),
	description: text("description"),
	placeholder: text("placeholder"),
	defaultPrompt: text("defaultPrompt"),
	userPrompt: text("userPrompt"),
	promptStrategy: text("promptStrategy", {
		enum: ["auto_generate", "user_defined", "hybrid"],
	})
		.notNull()
		.default("auto_generate"),
	generationHints: text("generationHints", { mode: "json" }).$type<{
		model?: string;
		temperature?: number;
		maxTokens?: number;
		style?: string;
	}>(),
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updatedAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type TemplateSection = InferSelectModel<typeof templateSection>;

/**
 * Content sources — maps a GitHub repo directory to a content template.
 * Each source points to a specific path in a repo where markdown files live,
 * linked 1:1 to a content template for generation.
 */
export const contentSource = sqliteTable("ContentSource", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("userId")
		.notNull()
		.references(() => user.id),
	projectId: text("projectId")
		.notNull()
		.references(() => project.id),
	name: text("name").notNull(),
	repoOwner: text("repoOwner").notNull(),
	repoName: text("repoName").notNull(),
	basePath: text("basePath").notNull(),
	filePattern: text("filePattern", { enum: ["md", "mdx", "both", "astro", "ts", "all"] })
		.notNull()
		.default("all"),
	templateId: text("templateId").references(() => contentTemplate.id),
	defaultBranch: text("defaultBranch").notNull().default("main"),
	status: text("status", { enum: ["active", "paused", "error"] })
		.notNull()
		.default("active"),
	lastSyncedAt: integer("lastSyncedAt", { mode: "timestamp" }),
	metadata: text("metadata", { mode: "json" }).$type<{
		fileCount?: number;
		lastCommitSha?: string;
		description?: string;
		metadataProfile?: "frontmatter-v1";
		metadataValidation?: "strict";
		platform?: "astro-next";
	}>(),
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updatedAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type ContentSource = InferSelectModel<typeof contentSource>;

// ============================================================================
// Psychology Engine Tables
// ============================================================================

/**
 * Creator profile — one per user+project pair.
 * Stores the creator's evolving identity, voice, and strategic positioning.
 */
export const creatorProfile = sqliteTable("CreatorProfile", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("userId")
		.notNull()
		.references(() => user.id),
	projectId: text("projectId"),
	displayName: text("displayName"),
	voice: text("voice", { mode: "json" }).$type<{
		tone?: string;
		vocabulary?: string[];
		rhetoricalDevices?: string[];
		avoidWords?: string[];
	}>(),
	positioning: text("positioning", { mode: "json" }).$type<{
		niche?: string;
		uniqueAngle?: string;
		competitors?: string[];
		differentiators?: string[];
	}>(),
	values: text("values", { mode: "json" }).$type<string[]>(),
	currentChapterId: text("currentChapterId"),
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updatedAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type CreatorProfile = InferSelectModel<typeof creatorProfile>;

/**
 * Narrative chapters — named arcs in the creator's journey.
 * Each chapter represents a phase (e.g., "Launch", "Pivot", "Scale").
 */
export const narrativeChapter = sqliteTable("NarrativeChapter", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	profileId: text("profileId")
		.notNull()
		.references(() => creatorProfile.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	summary: text("summary"),
	status: text("status", { enum: ["active", "closed"] })
		.notNull()
		.default("active"),
	openedAt: integer("openedAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	closedAt: integer("closedAt", { mode: "timestamp" }),
});

export type NarrativeChapter = InferSelectModel<typeof narrativeChapter>;

/**
 * Creator entries — raw inputs from the weekly ritual.
 * Free-form reflections, wins, struggles, ideas the creator writes.
 */
export const creatorEntry = sqliteTable("CreatorEntry", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	profileId: text("profileId")
		.notNull()
		.references(() => creatorProfile.id, { onDelete: "cascade" }),
	chapterId: text("chapterId")
		.references(() => narrativeChapter.id),
	entryType: text("entryType", {
		enum: ["reflection", "win", "struggle", "idea", "pivot"],
	})
		.notNull()
		.default("reflection"),
	content: text("content").notNull(),
	tags: text("tags", { mode: "json" }).$type<string[]>(),
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type CreatorEntry = InferSelectModel<typeof creatorEntry>;

/**
 * Narrative updates — AI-synthesized insights from creator entries.
 * The psychologist agent produces these; creator reviews before merging.
 */
export const narrativeUpdate = sqliteTable("NarrativeUpdate", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	profileId: text("profileId")
		.notNull()
		.references(() => creatorProfile.id, { onDelete: "cascade" }),
	chapterId: text("chapterId")
		.references(() => narrativeChapter.id),
	sourceEntryIds: text("sourceEntryIds", { mode: "json" }).$type<string[]>(),
	voiceDelta: text("voiceDelta", { mode: "json" }).$type<Record<string, unknown>>(),
	positioningDelta: text("positioningDelta", { mode: "json" }).$type<Record<string, unknown>>(),
	narrativeSummary: text("narrativeSummary"),
	status: text("status", { enum: ["pending", "approved", "rejected"] })
		.notNull()
		.default("pending"),
	reviewedAt: integer("reviewedAt", { mode: "timestamp" }),
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type NarrativeUpdate = InferSelectModel<typeof narrativeUpdate>;

/**
 * Customer personas — audience segment models.
 * Each persona captures demographics, pain points, language patterns.
 */
export const customerPersona = sqliteTable("CustomerPersona", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("userId")
		.notNull()
		.references(() => user.id),
	projectId: text("projectId"),
	name: text("name").notNull(),
	avatar: text("avatar"),
	demographics: text("demographics", { mode: "json" }).$type<{
		ageRange?: string;
		role?: string;
		industry?: string;
		experience?: string;
	}>(),
	painPoints: text("painPoints", { mode: "json" }).$type<string[]>(),
	goals: text("goals", { mode: "json" }).$type<string[]>(),
	language: text("language", { mode: "json" }).$type<{
		vocabulary?: string[];
		objections?: string[];
		triggers?: string[];
	}>(),
	contentPreferences: text("contentPreferences", { mode: "json" }).$type<{
		formats?: string[];
		channels?: string[];
		frequency?: string;
	}>(),
	confidence: integer("confidence").default(50),
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updatedAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type CustomerPersona = InferSelectModel<typeof customerPersona>;

/**
 * Content angles — generated by The Bridge (crossing creator narrative with customer pain).
 * Each angle is a strategic content opportunity ready to be turned into a piece.
 */
export const contentAngle = sqliteTable("ContentAngle", {
	id: text("id")
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("userId")
		.notNull()
		.references(() => user.id),
	projectId: text("projectId"),
	personaId: text("personaId")
		.references(() => customerPersona.id),
	title: text("title").notNull(),
	hook: text("hook"),
	angle: text("angle").notNull(),
	contentType: text("contentType", {
		enum: ["article", "newsletter", "video_script", "social_post"],
	})
		.notNull()
		.default("article"),
	narrativeThread: text("narrativeThread"),
	painPointAddressed: text("painPointAddressed"),
	confidence: integer("confidence").default(70),
	status: text("status", { enum: ["suggested", "selected", "used", "dismissed"] })
		.notNull()
		.default("suggested"),
	selectedAt: integer("selectedAt", { mode: "timestamp" }),
	createdAt: integer("createdAt", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type ContentAngle = InferSelectModel<typeof contentAngle>;

/**
 * Robot run history — synced from Python SQLite via SyncService.
 * Robots write locally; this table receives pushes every 30s.
 * The dashboard reads here directly (no FastAPI proxy needed).
 */
export const robotRun = sqliteTable("RobotRun", {
	runId: text("runId").primaryKey().notNull(),
	robotName: text("robotName").notNull(),
	workflowType: text("workflowType").notNull(),
	startedAt: text("startedAt").notNull(), // ISO string (kept as text to match Python)
	finishedAt: text("finishedAt"),
	status: text("status", { enum: ["running", "success", "error"] })
		.notNull()
		.default("running"),
	inputsJson: text("inputsJson", { mode: "json" }).$type<Record<string, unknown>>(),
	outputsSummaryJson: text("outputsSummaryJson", { mode: "json" }).$type<Record<string, unknown>>(),
	error: text("error"),
	durationMs: integer("durationMs"),
	syncedAt: integer("syncedAt", { mode: "timestamp" }),
});

export type RobotRun = InferSelectModel<typeof robotRun>;
