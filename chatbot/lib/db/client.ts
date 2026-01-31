import "server-only";

import { createClient } from "@libsql/client";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { drizzle } from "drizzle-orm/libsql";
import { isTestEnvironment } from "../constants";

type Database = LibSQLDatabase<Record<string, never>>;

let db: Database | null = null;
let isLocalMode = false;

function initializeDb(): Database {
	if (db) return db;

	// Check if we have Turso credentials
	if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
		try {
			const client = createClient({
				url: process.env.TURSO_DATABASE_URL,
				authToken: process.env.TURSO_AUTH_TOKEN,
			});
			db = drizzle(client);
			console.log("✅ Turso Database connected");
			return db;
		} catch (error) {
			console.warn(
				"⚠️  Failed to connect to Turso, falling back to local SQLite:",
				error instanceof Error ? error.message : error,
			);
		}
	}

	// Fallback to local SQLite file
	try {
		const client = createClient({
			url: "file:./local.db",
		});
		db = drizzle(client);
		isLocalMode = true;
		console.log("✅ Local SQLite Database connected (local.db)");
		return db;
	} catch (error) {
		console.error(
			"❌ Failed to connect to local SQLite:",
			error instanceof Error ? error.message : error,
		);
		// Return a dummy object that will fail gracefully
		return {
			// biome-ignore lint/suspicious/noExplicitAny: Mock object
		} as any;
	}
}

export function getDb(): Database {
	if (isTestEnvironment) {
		// In test environment, return a mock DB
		return {
			// biome-ignore lint/suspicious/noExplicitAny: Mock for tests
		} as any;
	}

	return initializeDb();
}

/** Check if running in local development mode (using local SQLite) */
export function isLocalDevelopment(): boolean {
	return isLocalMode;
}

/** Get database connection info for health checks */
export function getDbInfo(): { type: "turso" | "local" | "none"; connected: boolean } {
	if (!db) {
		initializeDb();
	}

	if (!db || Object.keys(db).length === 0) {
		return { type: "none", connected: false };
	}

	return {
		type: isLocalMode ? "local" : "turso",
		connected: true,
	};
}
