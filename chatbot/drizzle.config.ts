import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env first, then .env.local (which overrides)
config({ path: ".env" });
config({ path: ".env.local", override: true });

export default defineConfig({
	schema: "./lib/db/schema.ts",
	out: "./lib/db/migrations",
	dialect: "turso",
	dbCredentials: {
		url: process.env.TURSO_DATABASE_URL || "file:./local.db",
		authToken: process.env.TURSO_AUTH_TOKEN,
	},
});
