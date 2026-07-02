/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Run migration 020: subscribe letterbox table
 *
 * Usage:
 *   node migrations/run_020.js
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
    path.resolve(__dirname, "020_subscribe_letterbox.sql"),
    "utf-8"
  );

  console.log("Running migration 020_subscribe_letterbox.sql ...");

  try {
    await pool.query(sql);
    console.log("Migration 020 applied successfully.");
  } catch (err) {
    console.error("Migration 020 failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
