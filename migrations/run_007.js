#!/usr/bin/env node
/**
 * Run migration 007: Add verification tracking columns to users table.
 *
 * Usage:
 *   node migrations/run_007.js
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
        const sqlPath = path.join(__dirname, "007_verification_tracking.sql");
        const sql = fs.readFileSync(sqlPath, "utf-8");

        console.log("🔄 Running migration 007...");
        await pool.query(sql);
        console.log("✅ Migration 007 completed successfully.");

        // Verify columns exist
        const check = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'users'
              AND column_name IN ('email_verified', 'phone_verified', 'registration_method')
            ORDER BY column_name;
        `);

        if (check.rows.length === 3) {
            console.log("✅ Verified: All 3 columns exist.");
            check.rows.forEach((r) =>
                console.log(`   - ${r.column_name} (${r.data_type})`)
            );
        } else {
            console.warn("⚠️  Expected 3 columns, found:", check.rows.length);
        }

        // Show backfill results
        const backfill = await pool.query(`
            SELECT
                COUNT(*) FILTER (WHERE email_verified = true) AS email_verified_count,
                COUNT(*) FILTER (WHERE phone_verified = true) AS phone_verified_count,
                COUNT(*) FILTER (WHERE registration_method IS NOT NULL) AS has_method_count
            FROM users;
        `);
        console.log("📊 Backfill stats:", backfill.rows[0]);

    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
