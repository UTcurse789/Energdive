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

    return new Pool({
        connectionString,
        ssl: {
            rejectUnauthorized: false,
        },

        // Pool tuning — safe defaults for a SaaS workload
        max: 20,                         // max connections in the pool
        idleTimeoutMillis: 30_000,       // close idle clients after 30s
        connectionTimeoutMillis: 10_000, // fail fast if DB unreachable
    });
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
