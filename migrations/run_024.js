/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Run migration 024: Third-party Resource Center email notification audit log
 *
 * Usage:
 *   node migrations/run_024.js
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
    path.resolve(__dirname, "024_resource_third_party_email_notifications.sql"),
    "utf-8"
  );

  console.log("Running migration 024_resource_third_party_email_notifications.sql ...");

  try {
    await pool.query(sql);
    console.log("Migration 024 applied successfully.");
  } catch (err) {
    console.error("Migration 024 failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
