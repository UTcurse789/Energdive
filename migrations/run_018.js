/**
 * Run migration 018: Add has_submitted_paper flag to users table
 *
 * Usage:
 *   node migrations/run_018.js
 *
 * Requires DATABASE_URL in environment or .env
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
    path.resolve(__dirname, "018_user_submission_flag.sql"),
    "utf-8"
  );

  console.log("Running migration 018_user_submission_flag.sql ...");

  try {
    await pool.query(sql);
    console.log("✅ Migration 018 applied successfully.");
  } catch (err) {
    console.error("❌ Migration 018 failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
