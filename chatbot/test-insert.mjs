import { createClient } from "@libsql/client";

const client = createClient({
	url: process.env.TURSO_DATABASE_URL,
	authToken: process.env.TURSO_AUTH_TOKEN,
});

try {
	console.log("Testing insert with Drizzle-like pattern...");

	// Test connection
	const test = await client.execute("SELECT 1");
	console.log("✅ Connected");

	// Test insert with returning
	const result = await client.execute({
		sql: `INSERT INTO User (id, email, password) VALUES (?, ?, ?) RETURNING id, email`,
		args: [crypto.randomUUID(), `guest-${Date.now()}`, "hashed"],
	});

	console.log("✅ Insert result:", result.rows);
} catch (error) {
	console.error("❌ Error:", error.message);
	console.error("Stack:", error.stack);
}
