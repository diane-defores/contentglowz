import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const url = "libsql://bizflowz-dianedef.aws-eu-west-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjgzOTUwMzcsImlkIjoiZjk2MTk3MTgtNmQyMi00ZDQ3LWE3MDgtMTk1NzI3MDE5ZjEyIiwicmlkIjoiNGJkN2MxYWItOGE5Yi00ODA4LWE1ZGUtMTRlZTg5YmMwZTM0In0.EmTEZCB57TWTmxa-dt6Bz_zI09WWX3DzZLjmiDDodeiolsfBXLmE3TwnN0MO3Ct58gexKdeU7WpA7mBOd0ozAg";

const client = createClient({ url, authToken });

try {
  console.log("🔌 Testing connection...");
  const test = await client.execute("SELECT 1 as test");
  console.log("✅ Connected:", test.rows);
  
  console.log("\n📝 Testing User insert...");
  const uuid = crypto.randomUUID();
  const result = await client.execute({
    sql: `INSERT INTO User (id, email, password) VALUES (?, ?, ?) RETURNING *`,
    args: [uuid, `guest-${Date.now()}@test.com`, "hashed123"]
  });
  console.log("✅ User created:", result.rows);
  
  console.log("\n✅ TURSO FONCTIONNE PARFAITEMENT!");
} catch (error) {
  console.error("❌ Error:", error.message);
}
