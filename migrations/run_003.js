require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const rawUrl = process.env.DATABASE_URL || "";
if (!rawUrl) {
    console.error("❌ DATABASE_URL not found. Check .env.local");
    process.exit(1);
}
const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, "");
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

const sql = fs.readFileSync(path.join(__dirname, "003_community_discussions.sql"), "utf8");

pool.query(sql)
    .then(() => { console.log("✅ Community tables created successfully"); pool.end(); })
    .catch((e) => { console.error("❌ Error:", e.message); pool.end(); process.exit(1); });
