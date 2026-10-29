/* eslint-disable @typescript-eslint/no-require-imports */
const { Pool } = require("pg");
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env"), quiet: true });

async function run() {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL.replace(/[?&]sslmode=[^&]*/g, ""), ssl: { rejectUnauthorized: false } });
    try {
        await pool.query(fs.readFileSync(path.join(__dirname, "025_briefing_editions.sql"), "utf8"));
        console.log("Migration 025 applied successfully.");
    } finally { await pool.end(); }
}
run().catch(error => { console.error(error.message); process.exitCode = 1; });
