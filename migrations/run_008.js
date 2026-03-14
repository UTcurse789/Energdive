// migrations/run_008.js
// Run: node migrations/run_008.js

require("dotenv").config({ path: ".env.local" });
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

    const sql = fs.readFileSync(
        path.join(__dirname, "008_double_optin_membership.sql"),
        "utf8"
    );

    const client = await pool.connect();
    try {
        console.log("Running migration 008...");
        await client.query(sql);
        console.log("✅ Migration 008 complete.");
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run();