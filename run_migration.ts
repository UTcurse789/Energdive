import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import fs from "fs";
import { query } from "./lib/db";

async function run() {
    const sql = fs.readFileSync("migrations/010_update_pending_verifications.sql", "utf-8");
    console.log("Running migration...");
    await query(sql);
    console.log("Done.");
    process.exit(0);
}

run().catch(console.error);
