import { Pool, PoolClient, QueryResultRow } from "pg";

// ---------------------------------------------------------------------------
// Production-grade PostgreSQL connection pool
// ---------------------------------------------------------------------------
// DigitalOcean Managed PG uses CA-signed certs. pg v8+ changed SSL handling:
// when `sslmode=require` is in the URL, pg validates the certificate chain.
// For managed PG (DigitalOcean, Supabase, etc.) we must strip sslmode from
// the URL and configure SSL purely in code with rejectUnauthorized: false.
// ---------------------------------------------------------------------------

const globalForPg = globalThis as unknown as { pool: Pool | undefined };

function createPool(): Pool {
    // Strip sslmode from connection string — we handle SSL in code
    const rawUrl = process.env.DATABASE_URL || "";
    const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, "");

    const pool = new Pool({
        connectionString,
        ssl: {
            rejectUnauthorized: false, // Required for DigitalOcean / self-signed certs
        },

        // Pool tuning — conservative for managed DB with limited connections
        max: 5,                          // keep low for DigitalOcean managed DB
        idleTimeoutMillis: 10_000,       // close idle clients after 10s
        connectionTimeoutMillis: 5_000,  // fail fast if DB unreachable
    });

    // Error handling to prevent "Error: Connection terminated unexpectedly" crashing the app
    pool.on('error', (err, client) => {
        console.error('Unexpected error on idle client', err);
        // process.exit(-1); // Don't exit in Next.js, just log
    });

    pool.on('connect', (client) => {
        // console.log('New client connected to pool');
    });

    return pool;
}

const pool: Pool = globalForPg.pool ?? createPool();

// In development, cache on globalThis so the pool survives hot-reloads
if (process.env.NODE_ENV !== "production") {
    globalForPg.pool = pool;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Run a parameterized SQL query (auto-acquires + releases client). */
export async function query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
) {
    return pool.query<T>(text, params);
}

/** Acquire a dedicated client for manual transaction control.
 *  ALWAYS call `client.release()` in a `finally` block. */
export async function getClient(): Promise<PoolClient> {
    return pool.connect();
}

export default pool;
