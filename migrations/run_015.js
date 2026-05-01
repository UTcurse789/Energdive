/**
 * Run migration 015: Preference-based content digests
 * Usage: node migrations/run_015.js
 */
require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function run() {
    const rawUrl = process.env.DATABASE_URL || "";
    if (!rawUrl) {
        console.error("DATABASE_URL is not set");
        process.exit(1);
    }

    const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, "");

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
    });

    try {
        const sql = fs.readFileSync(
            path.join(__dirname, "015_content_digests.sql"),
            "utf-8"
        );
        console.log("Running migration 015 - Preference content digests...");
        await pool.query(sql);
        console.log("Migration 015 completed successfully.");
    } catch (err) {
        console.error("Migration 015 failed:", err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
