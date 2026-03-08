import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

// Load .env first, then .env.local (which overrides)
config({ path: ".env" });
config({ path: ".env.local", override: true });

/**
 * Applies individual ALTER TABLE statements that might fail
 * if the column already exists (SQLite has no IF NOT EXISTS for columns).
 */
async function applyManualMigrations(
	client: ReturnType<typeof createClient>,
) {
	const stmts = [
		// From 0010
		"ALTER TABLE `Chat` ADD `type` text NOT NULL DEFAULT 'chat'",
		"ALTER TABLE `Chat` ADD `chatStatus` text NOT NULL DEFAULT 'active'",
		// From 0011
		"ALTER TABLE `ContentRecord` ADD `currentVersion` integer DEFAULT 0 NOT NULL",
		// From 0016
		"ALTER TABLE `Project` ADD `posthogProjectId` text",
	];

	for (const sql of stmts) {
		try {
			await client.execute(sql);
			console.log("  ✓", sql.slice(0, 60) + "...");
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			if (msg.includes("duplicate column") || msg.includes("already exists")) {
				// Column already exists — skip
			} else {
				console.warn("  ⚠️ ", sql.slice(0, 60), "→", msg);
			}
		}
	}
}

const runMigrate = async () => {
	if (!process.env.TURSO_DATABASE_URL) {
		console.warn(
			"⚠️  TURSO_DATABASE_URL is not defined. Skipping migrations for local development.",
		);
		process.exit(0);
	}

	const client = createClient({
		url: process.env.TURSO_DATABASE_URL,
		authToken: process.env.TURSO_AUTH_TOKEN,
	});

	try {
		const db = drizzle(client);

		console.log("⏳ Running migrations on Turso...");

		const start = Date.now();
		await migrate(db, { migrationsFolder: "./lib/db/migrations" });
		const end = Date.now();

		console.log("✅ Migrations completed in", end - start, "ms");
		process.exit(0);
	} catch (error) {
		const msg = error instanceof Error ? error.message : String(error);

		// If the standard migrator fails (e.g. "already exists" conflicts),
		// fall back to applying individual statements manually.
		if (
			msg.includes("already exists") ||
			msg.includes("duplicate column")
		) {
			console.log(
				"⚠️  Standard migrator hit conflicts. Applying manual fixes...",
			);
			await applyManualMigrations(client);
			console.log("✅ Manual migrations applied.");
			process.exit(0);
		}

		console.warn(
			"⚠️  Failed to run migrations. Continuing for local development...",
		);
		console.warn("Error:", msg);
		process.exit(0);
	}
};

runMigrate();
