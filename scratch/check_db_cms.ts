import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env") });

async function run() {
  const { query } = await import("../lib/db");

  const result = await query("SELECT * FROM energjob_jobs");
  console.log("Jobs in DB:", JSON.stringify(result.rows, null, 2));
}

run().catch(console.error);
