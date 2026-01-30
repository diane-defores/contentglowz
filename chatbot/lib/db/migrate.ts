import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

config({
	path: ".env",
});

const runMigrate = async () => {
	if (!process.env.TURSO_DATABASE_URL) {
		console.warn(
			"⚠️  TURSO_DATABASE_URL is not defined. Skipping migrations for local development.",
		);
		process.exit(0);
	}

	try {
		const client = createClient({
			url: process.env.TURSO_DATABASE_URL,
			authToken: process.env.TURSO_AUTH_TOKEN,
		});
		const db = drizzle(client);

		console.log("⏳ Running migrations on Turso...");

		const start = Date.now();
		await migrate(db, { migrationsFolder: "./lib/db/migrations" });
		const end = Date.now();

		console.log("✅ Migrations completed in", end - start, "ms");
		process.exit(0);
	} catch (error) {
		console.warn(
			"⚠️  Failed to run migrations. Continuing for local development...",
		);
		console.warn("Error:", error instanceof Error ? error.message : error);
		process.exit(0);
	}
};

runMigrate();
