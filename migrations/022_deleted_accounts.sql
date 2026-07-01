-- Migration 022: Create deleted_accounts audit table
-- Stores a record of every account deletion with user info, reason, and location.

CREATE TABLE IF NOT EXISTS deleted_accounts (
    id            SERIAL PRIMARY KEY,
    clerk_id      TEXT NOT NULL,
    name          TEXT,
    email         TEXT,
    company_name  TEXT,
    location      TEXT,          -- JSON string from ipapi (city, region, country, ip)
    reason        TEXT NOT NULL,
    deleted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups by email (e.g. support queries)
CREATE INDEX IF NOT EXISTS idx_deleted_accounts_email ON deleted_accounts (email);
