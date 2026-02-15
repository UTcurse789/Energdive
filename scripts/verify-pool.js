
require('dotenv').config();
const { Pool } = require('pg');

// Replicating lib/db.ts logic
function createPool() {
    const rawUrl = process.env.DATABASE_URL || "";
    // Replicating: const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, "");
    const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, "");

    console.log("Original URL length:", rawUrl.length);
    console.log("Sanitized URL length:", connectionString.length);
    // Be careful not to log full URL for security, sticking to lengths/structure

    // Check if URL starts with postgres:// or postgresql://
    if (!connectionString.startsWith('postgres')) {
        console.error("Invalid protocol in connection string");
    }

    const pool = new Pool({
        connectionString,
        ssl: {
            rejectUnauthorized: false,
        },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
        console.error('Pool error:', err.message);
    });

    return pool;
}

async function verify() {
    console.log("Starting verification...");
    const pool = createPool();
    try {
        const client = await pool.connect();
        console.log("Successfully connected!");
        const res = await client.query('SELECT NOW() as now');
        console.log("Query result:", res.rows[0]);
        client.release();
    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        await pool.end();
    }
}

verify();
