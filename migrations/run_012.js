require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function run() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    const sql = fs.readFileSync(path.join(__dirname, "012_add_salutation.sql"), "utf8");
    try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("COMMIT");
        console.log("Migration 012 applied successfully.");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Migration 012 failed:", error);
    } finally {
        await client.end();
    }
}

run();
