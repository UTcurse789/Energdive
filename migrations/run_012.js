/**
 * Run migration 012: Reminder & drip tracking columns
 * Usage: node migrations/run_012.js
 */
require("dotenv").config();
const fs = require("fs");
const { Pool } = require("pg");

const rawUrl = process.env.DATABASE_URL || "";
const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, "");

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function run() {
    const client = await pool.connect();
    try {
        const sql = fs.readFileSync("migrations/012_reminder_drip_columns.sql", "utf-8");
        console.log("⏳ Running migration 012...");
        await client.query(sql);
        console.log("✅ Migration 012 completed successfully.");

        // Verify columns exist
        const usersCheck = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'users' AND column_name IN ('reminder_email_count', 'last_reminder_sent_at', 'reminder_week_start', 'reminder_opted_out')
            ORDER BY column_name
        `);
        console.log("📋 Users columns added:", usersCheck.rows.map(r => r.column_name));

        const pvCheck = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'pending_verifications' AND column_name IN ('drip_step', 'drip_next_send_at', 'drip_opted_out', 'drip_started_at')
            ORDER BY column_name
        `);
        console.log("📋 pending_verifications columns added:", pvCheck.rows.map(r => r.column_name));
    } catch (err) {
        console.error("❌ Migration 012 failed:", err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
