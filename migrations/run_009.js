/**
 * Run migration 009: Production OTP + System Logs
 * Usage: node migrations/run_009.js
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
            path.join(__dirname, "009_production_optin_system.sql"),
            "utf-8"
        );
        console.log("Running migration 009...");
        await pool.query(sql);
        console.log("✅ Migration 009 completed successfully.");
    } catch (err) {
        console.error("❌ Migration 009 failed:", err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
