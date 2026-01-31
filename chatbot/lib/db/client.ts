import "server-only";

import { createClient } from "@libsql/client";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { drizzle } from "drizzle-orm/libsql";
import { isTestEnvironment } from "../constants";

type Database = LibSQLDatabase<Record<string, never>>;

let db: Database | null = null;

function initializeDb(): Database {
	if (db) return db;

	if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
		console.error("❌ TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required");
		console.error("   Get your free database at: https://turso.tech");
		return {} as any;
	}

	try {
		const client = createClient({
			url: process.env.TURSO_DATABASE_URL,
			authToken: process.env.TURSO_AUTH_TOKEN,
		});
		db = drizzle(client);
		console.log("✅ Turso Database connected");
		return db;
	} catch (error) {
		console.error(
			"❌ Failed to connect to Turso:",
			error instanceof Error ? error.message : error,
		);
		return {} as any;
	}
}

export function getDb(): Database {
	if (isTestEnvironment) {
		return {} as any;
	}
	return initializeDb();
}

/** Get database connection info for health checks */
export function getDbInfo(): { connected: boolean } {
	if (!db) initializeDb();
	return { connected: !!db && Object.keys(db).length > 0 };
}
