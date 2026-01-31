/**
 * Initialize local SQLite database with schema
 * Run with: npx tsx scripts/init-local-db.ts
 */

import { createClient } from "@libsql/client";

const client = createClient({
	url: "file:./local.db",
});

const schema = `
-- Users
CREATE TABLE IF NOT EXISTS User (
	id TEXT PRIMARY KEY NOT NULL,
	email TEXT NOT NULL,
	password TEXT
);

-- Chats
CREATE TABLE IF NOT EXISTS Chat (
	id TEXT PRIMARY KEY NOT NULL,
	createdAt INTEGER NOT NULL,
	title TEXT NOT NULL,
	userId TEXT NOT NULL,
	visibility TEXT DEFAULT 'private' NOT NULL,
	lastContext TEXT,
	FOREIGN KEY (userId) REFERENCES User(id)
);

-- Messages (v2)
CREATE TABLE IF NOT EXISTS Message_v2 (
	id TEXT PRIMARY KEY NOT NULL,
	chatId TEXT NOT NULL,
	role TEXT NOT NULL,
	parts TEXT NOT NULL,
	attachments TEXT NOT NULL,
	createdAt INTEGER NOT NULL,
	FOREIGN KEY (chatId) REFERENCES Chat(id)
);

-- Legacy Messages
CREATE TABLE IF NOT EXISTS Message (
	id TEXT PRIMARY KEY NOT NULL,
	chatId TEXT NOT NULL,
	role TEXT NOT NULL,
	content TEXT NOT NULL,
	createdAt INTEGER NOT NULL,
	FOREIGN KEY (chatId) REFERENCES Chat(id)
);

-- Votes (v2)
CREATE TABLE IF NOT EXISTS Vote_v2 (
	chatId TEXT NOT NULL,
	messageId TEXT NOT NULL,
	isUpvoted INTEGER NOT NULL,
	PRIMARY KEY (chatId, messageId),
	FOREIGN KEY (chatId) REFERENCES Chat(id),
	FOREIGN KEY (messageId) REFERENCES Message_v2(id)
);

-- Legacy Votes
CREATE TABLE IF NOT EXISTS Vote (
	chatId TEXT NOT NULL,
	messageId TEXT NOT NULL,
	isUpvoted INTEGER NOT NULL,
	PRIMARY KEY (chatId, messageId),
	FOREIGN KEY (chatId) REFERENCES Chat(id),
	FOREIGN KEY (messageId) REFERENCES Message(id)
);

-- Documents
CREATE TABLE IF NOT EXISTS Document (
	id TEXT NOT NULL,
	createdAt INTEGER NOT NULL,
	title TEXT NOT NULL,
	content TEXT,
	kind TEXT DEFAULT 'text' NOT NULL,
	userId TEXT NOT NULL,
	PRIMARY KEY (id, createdAt),
	FOREIGN KEY (userId) REFERENCES User(id)
);

-- Suggestions
CREATE TABLE IF NOT EXISTS Suggestion (
	id TEXT PRIMARY KEY NOT NULL,
	documentId TEXT NOT NULL,
	documentCreatedAt INTEGER NOT NULL,
	originalText TEXT NOT NULL,
	suggestedText TEXT NOT NULL,
	description TEXT,
	isResolved INTEGER DEFAULT 0 NOT NULL,
	userId TEXT NOT NULL,
	createdAt INTEGER NOT NULL,
	FOREIGN KEY (userId) REFERENCES User(id)
);

-- Message Suggestions (junction)
CREATE TABLE IF NOT EXISTS MessageSuggestion (
	messageId TEXT NOT NULL,
	suggestionId TEXT NOT NULL,
	PRIMARY KEY (messageId, suggestionId),
	FOREIGN KEY (messageId) REFERENCES Message_v2(id),
	FOREIGN KEY (suggestionId) REFERENCES Suggestion(id)
);

-- Streams
CREATE TABLE IF NOT EXISTS Stream (
	id TEXT PRIMARY KEY NOT NULL,
	chatId TEXT NOT NULL,
	createdAt INTEGER NOT NULL,
	FOREIGN KEY (chatId) REFERENCES Chat(id)
);

-- Projects
CREATE TABLE IF NOT EXISTS Project (
	id TEXT PRIMARY KEY NOT NULL,
	userId TEXT NOT NULL,
	name TEXT NOT NULL,
	url TEXT NOT NULL,
	type TEXT DEFAULT 'github' NOT NULL,
	description TEXT,
	isDefault INTEGER DEFAULT 0 NOT NULL,
	settings TEXT,
	lastAnalyzedAt INTEGER,
	createdAt INTEGER NOT NULL,
	FOREIGN KEY (userId) REFERENCES User(id)
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS ActivityLog (
	id TEXT PRIMARY KEY NOT NULL,
	userId TEXT NOT NULL,
	projectId TEXT,
	action TEXT NOT NULL,
	robotId TEXT,
	status TEXT DEFAULT 'started' NOT NULL,
	details TEXT,
	createdAt INTEGER NOT NULL,
	completedAt INTEGER,
	FOREIGN KEY (userId) REFERENCES User(id),
	FOREIGN KEY (projectId) REFERENCES Project(id)
);

-- Affiliate Links
CREATE TABLE IF NOT EXISTS AffiliateLink (
	id TEXT PRIMARY KEY NOT NULL,
	userId TEXT NOT NULL,
	name TEXT NOT NULL,
	url TEXT NOT NULL,
	category TEXT,
	commission TEXT,
	keywords TEXT,
	status TEXT DEFAULT 'active' NOT NULL,
	notes TEXT,
	expiresAt INTEGER,
	createdAt INTEGER NOT NULL,
	updatedAt INTEGER NOT NULL,
	FOREIGN KEY (userId) REFERENCES User(id)
);

-- Competitors
CREATE TABLE IF NOT EXISTS Competitor (
	id TEXT PRIMARY KEY NOT NULL,
	userId TEXT NOT NULL,
	name TEXT NOT NULL,
	url TEXT NOT NULL,
	niche TEXT,
	priority TEXT DEFAULT 'medium' NOT NULL,
	notes TEXT,
	lastAnalyzedAt INTEGER,
	analysisData TEXT,
	createdAt INTEGER NOT NULL,
	FOREIGN KEY (userId) REFERENCES User(id)
);

-- User Settings
CREATE TABLE IF NOT EXISTS UserSettings (
	id TEXT PRIMARY KEY NOT NULL,
	userId TEXT NOT NULL UNIQUE,
	theme TEXT DEFAULT 'system' NOT NULL,
	language TEXT DEFAULT 'en',
	emailNotifications INTEGER DEFAULT 1 NOT NULL,
	webhookUrl TEXT,
	apiKeys TEXT,
	defaultProjectId TEXT,
	dashboardLayout TEXT,
	robotSettings TEXT,
	createdAt INTEGER NOT NULL,
	updatedAt INTEGER NOT NULL,
	FOREIGN KEY (userId) REFERENCES User(id)
);
`;

async function main() {
	console.log("🔧 Initializing local SQLite database...\n");

	// Split schema into individual statements
	const statements = schema
		.split(";")
		.map((s) => s.trim())
		.filter((s) => s.length > 0);

	for (const statement of statements) {
		try {
			await client.execute(statement);
			// Extract table name for logging
			const match = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
			if (match) {
				console.log(`  ✅ ${match[1]}`);
			}
		} catch (error) {
			console.error(`  ❌ Error: ${error instanceof Error ? error.message : error}`);
		}
	}

	// Verify tables
	const result = await client.execute(
		"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
	);

	console.log("\n📋 Tables in local.db:");
	result.rows.forEach((row) => console.log(`  - ${row.name}`));

	console.log("\n✅ Local database ready!");
}

main().catch(console.error);
