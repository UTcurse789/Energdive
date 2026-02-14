require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkDb() {
    try {
        const client = await pool.connect();
        console.log("Successfully connected to database!");

        // List tables
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

        console.log("Tables found:", res.rows.map(r => r.table_name));

        client.release();
    } catch (err) {
        console.error("Connection failed:", err);
    } finally {
        await pool.end();
    }
}

checkDb();
