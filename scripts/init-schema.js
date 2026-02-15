/**
 * init-schema.js
 * ──────────────────────────────────────────────────────────────────
 * Creates all application tables on the DigitalOcean PostgreSQL DB.
 * Run once:  node scripts/init-schema.js
 * Idempotent — uses IF NOT EXISTS everywhere.
 * ──────────────────────────────────────────────────────────────────
 */

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const SCHEMA_SQL = `
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Industries ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS industries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL UNIQUE,
    slug        VARCHAR(255) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─── Sub-Industries ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sub_industries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(255) NOT NULL UNIQUE,
    industry_id UUID         NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_industries_industry ON sub_industries(industry_id);

-- ─── Communities (self-referencing hierarchy) ────────────────────
CREATE TABLE IF NOT EXISTS communities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL UNIQUE,
    slug        VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    parent_id   UUID         REFERENCES communities(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_communities_parent ON communities(parent_id);

-- ─── Users ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id          VARCHAR(255) NOT NULL UNIQUE,
    email             VARCHAR(255) NOT NULL UNIQUE,
    first_name        VARCHAR(255),
    last_name         VARCHAR(255),
    phone             VARCHAR(50),

    -- Professional
    job_title         VARCHAR(255),
    organization_name VARCHAR(255),

    -- Location
    country           VARCHAR(100),
    state             VARCHAR(100),

    -- Onboarding
    is_onboarded      BOOLEAN NOT NULL DEFAULT false,

    -- Taxonomy FKs
    industry_id       UUID REFERENCES industries(id) ON DELETE SET NULL,
    sub_industry_id   UUID REFERENCES sub_industries(id) ON DELETE SET NULL,

    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── User <-> Community (many-to-many) ───────────────────────────
CREATE TABLE IF NOT EXISTS user_communities (
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    assigned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, community_id)
);

CREATE INDEX IF NOT EXISTS idx_user_communities_user ON user_communities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_communities_community ON user_communities(community_id);
`;

async function run() {
    const client = await pool.connect();
    try {
        console.log("⏳ Creating tables...");
        await client.query(SCHEMA_SQL);
        console.log("✅ All tables created successfully.");

        // Verify
        const res = await client.query(`
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        console.log("📋 Tables:", res.rows.map((r) => r.table_name));
    } catch (err) {
        console.error("❌ Schema creation failed:", err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
