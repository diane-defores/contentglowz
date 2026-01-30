import "server-only";

import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { isTestEnvironment } from "../constants";

type Database = LibSQLDatabase<Record<string, never>>;

let db: Database | null = null;

function initializeDb(): Database {
  if (db) return db;

  if (!process.env.TURSO_DATABASE_URL) {
    console.warn(
      "⚠️  TURSO_DATABASE_URL not set. Running in offline mode. Database operations will fail."
    );
    // Return a dummy object that will fail gracefully
    return {
      // biome-ignore lint/suspicious/noExplicitAny: Mock object
    } as any;
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
    console.warn(
      "⚠️  Failed to connect to Turso database:",
      error instanceof Error ? error.message : error
    );
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
