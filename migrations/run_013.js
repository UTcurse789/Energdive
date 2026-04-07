/**
 * Run migration 013: Add salutation column
 * Usage: node migrations/run_013.js
 */
require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function run() {
    const rawUrl = process.env.DATABASE_URL || "";
    const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, "");

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
    });

    try {
        const sql = fs.readFileSync(
            path.join(__dirname, "013_salutation.sql"),
            "utf-8"
        );
        console.log("Running migration 013...");
        await pool.query(sql);
        console.log("✅ Migration 013 completed successfully.");
    } catch (err) {
        console.error("❌ Migration 013 failed:", err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
