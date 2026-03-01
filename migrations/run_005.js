#!/usr/bin/env node
/**
 * Run migration 005: Add subscription preference columns to users table.
 *
 * Usage:
 *   node migrations/run_005.js
 *
 * Requires DATABASE_URL in .env
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

async function main() {
    const rawUrl = process.env.DATABASE_URL || "";
    if (!rawUrl) {
        console.error("❌ DATABASE_URL is not set");
        process.exit(1);
    }

    // Strip sslmode from URL — handle SSL in code (same as lib/db.ts)
    const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, "");

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10_000,
    });

    try {
        const sqlPath = path.join(__dirname, "005_user_preferences.sql");
        const sql = fs.readFileSync(sqlPath, "utf-8");

        console.log("🔄 Running migration 005...");
        await pool.query(sql);
        console.log("✅ Migration 005 completed successfully.");

        // Verify columns exist
        const check = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'users'
              AND column_name IN ('preferred_frequency', 'preferred_formats')
            ORDER BY column_name;
        `);

        if (check.rows.length === 2) {
            console.log("✅ Verified: Both columns exist.");
            check.rows.forEach((r) =>
                console.log(`   - ${r.column_name} (${r.data_type})`)
            );
        } else {
            console.warn("⚠️  Expected 2 columns, found:", check.rows.length);
        }
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
