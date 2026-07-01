/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Run migration 023: Resource Center download audit trail
 *
 * Usage:
 *   node migrations/run_023.js
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
    path.resolve(__dirname, "023_resource_download_events.sql"),
    "utf-8"
  );

  console.log("Running migration 023_resource_download_events.sql ...");

  try {
    await pool.query(sql);
    console.log("Migration 023 applied successfully.");
  } catch (err) {
    console.error("Migration 023 failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
