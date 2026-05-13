/**
 * Run migration 016: ad_events tracking table
 *
 * Usage:
 *   node migrations/run_016.js
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
    path.resolve(__dirname, "016_ad_events.sql"),
    "utf-8"
  );

  console.log("Running migration 016_ad_events.sql ...");

  try {
    await pool.query(sql);
    console.log("✅ Migration 016 applied successfully.");
  } catch (err) {
    console.error("❌ Migration 016 failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
