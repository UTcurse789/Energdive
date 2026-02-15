require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");

const rawUrl = process.env.DATABASE_URL || "";
const connStr = rawUrl.replace(/[?&]sslmode=[^&]*/g, "");

const pool = new Pool({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
});

const TABLES = [
    "communities", "sub_communities", "industries", "sub_industries",
    "industry", "sectors", "users", "user_communities", "user_industries",
];

async function run() {
    const client = await pool.connect();
    const result = {};
    try {
        for (const table of TABLES) {
            const cols = await client.query(
                `SELECT column_name, data_type, is_nullable
                 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = $1
                 ORDER BY ordinal_position`, [table]
            );
            if (cols.rows.length > 0) {
                const sample = await client.query(`SELECT * FROM "${table}" LIMIT 2`);
                result[table] = { columns: cols.rows, sample: sample.rows };
            } else {
                result[table] = null;
            }
        }
        fs.writeFileSync("scripts/schema-result.json", JSON.stringify(result, null, 2));
        console.log("Done. Written to scripts/schema-result.json");
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        client.release();
        await pool.end();
    }
}
run();
