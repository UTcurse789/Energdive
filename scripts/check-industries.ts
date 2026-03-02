import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
    connectionString: (process.env.DATABASE_URL || "").replace(/[?&]sslmode=[^&]*/g, ""),
    ssl: { rejectUnauthorized: false },
});

async function main() {
    const r1 = await pool.query("SELECT id, name FROM industry ORDER BY id LIMIT 5");
    console.log("First 5 industries:");
    r1.rows.forEach((r: any) => console.log(`  ${r.id}: ${r.name}`));

    const r2 = await pool.query("SELECT COUNT(*) as c FROM industry");
    const r3 = await pool.query("SELECT COUNT(*) as c FROM sub_industries");
    console.log(`Total: ${r2.rows[0].c} industries, ${r3.rows[0].c} sub-industries`);

    const oilgas = await pool.query(
        "SELECT i.id as iid, s.name FROM sub_industries s JOIN industry i ON s.industry_id = i.id WHERE i.name = $1 ORDER BY s.name LIMIT 5",
        ["Oil & Gas"]
    );
    console.log("Oil & Gas (ID " + (oilgas.rows[0]?.iid || "?") + ") first 5 subs:");
    oilgas.rows.forEach((r: any) => console.log("  " + r.name));

    await pool.end();
}
main();
