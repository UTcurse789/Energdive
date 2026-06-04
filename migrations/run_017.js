/**
 * Run migration 017: energjob core tables
 *
 * Usage:
 *   node migrations/run_017.js
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

async function run() {
  const rawUrl = process.env.DATABASE_URL || "";
  const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, "");

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const sql = fs.readFileSync(
    path.resolve(__dirname, "017_energjob_core.sql"),
    "utf-8"
  );

  console.log("Running migration 017_energjob_core.sql ...");

  try {
    await pool.query(sql);
    console.log("✅ Migration 017 applied successfully.");
  } catch (err) {
    console.error("❌ Migration 017 failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
