import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(__dirname, "../.env") });

async function run() {
  const { query } = await import("../lib/db");

  const tables = await query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'energjob_%'`
  );
  console.log("Tables list:");
  for (const t of tables.rows) {
    const countRes = await query(`SELECT COUNT(*) FROM ${t.table_name}`);
    console.log(`Table: ${t.table_name}, Count: ${countRes.rows[0].count}`);
  }
}

run().catch(console.error);
