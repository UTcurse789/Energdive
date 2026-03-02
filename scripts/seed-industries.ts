/**
 * Seed script for industries & sub-industries.
 * Run: npx tsx scripts/seed-industries.ts
 */
import fs from "fs";
import path from "path";
import { Pool } from "pg";
import dotenv from "dotenv";

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const rawUrl = process.env.DATABASE_URL || "";
const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, "");

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function main() {
    const sqlPath = path.resolve(__dirname, "../migrations/006_seed_industries.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");

    console.log("🔄 Seeding industries and sub-industries...");

    try {
        await pool.query(sql);
        console.log("✅ Done! Industries and sub-industries seeded successfully.");

        // Quick verification
        const indRes = await pool.query("SELECT COUNT(*) as count FROM industry");
        const subRes = await pool.query("SELECT COUNT(*) as count FROM sub_industries");
        console.log(`   📊 ${indRes.rows[0].count} industries, ${subRes.rows[0].count} sub-industries`);
    } catch (err) {
        console.error("❌ Seed failed:", err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
