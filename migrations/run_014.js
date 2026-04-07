/**
 * Run migration 014: Data Provenance & Consent Management
 * Usage: node migrations/run_014.js
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
            path.join(__dirname, "014_data_provenance.sql"),
            "utf-8"
        );
        console.log("Running migration 014 — Data Provenance & Consent...");
        await pool.query(sql);
        console.log("✅ Migration 014 completed successfully.");
    } catch (err) {
        console.error("❌ Migration 014 failed:", err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
