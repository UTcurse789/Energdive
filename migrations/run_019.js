/**
 * Run migration 019: Rename has_submitted_paper to has_submitted_abstract in users table
 *
 * Usage:
 *   node migrations/run_019.js
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
    path.resolve(__dirname, "019_user_abstract_flag.sql"),
    "utf-8"
  );

  console.log("Running migration 019_user_abstract_flag.sql ...");

  try {
    await pool.query(sql);
    console.log("✅ Migration 019 applied successfully.");
  } catch (err) {
    console.error("❌ Migration 019 failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
