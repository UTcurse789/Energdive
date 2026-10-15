-- Durable editions and at-most-once dispatch. Run before deploying the worker.
BEGIN;
ALTER TABLE subscribe_letterbox ADD COLUMN IF NOT EXISTS last_content_digest_sent_at TIMESTAMPTZ;
ALTER TABLE subscribe_letterbox ADD COLUMN IF NOT EXISTS preferred_frequency VARCHAR(20);
ALTER TABLE subscribe_letterbox ADD COLUMN IF NOT EXISTS content_digest_opted_out BOOLEAN NOT NULL DEFAULT false;

-- Preserve the earliest actual publication timestamp observed from the CMS.
-- firstPublishedAt is preferred when provided; Date/createdAt/updatedAt never
-- establish publication. This protects against later Strapi republications.
CREATE TABLE IF NOT EXISTS briefing_publications (
    content_key TEXT PRIMARY KEY,
    first_published_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS briefing_featured_editions (
    edition_date DATE PRIMARY KEY,
    items JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS briefing_editions (
    id TEXT PRIMARY KEY,
    edition_date DATE NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly')),
    cutoff TIMESTAMPTZ NOT NULL,
    period_start DATE NOT NULL,
    sections JSONB NOT NULL,
    featured JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (edition_date, frequency)
);
CREATE TABLE IF NOT EXISTS briefing_deliveries (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL CHECK (email = LOWER(BTRIM(email))),
    edition_date DATE NOT NULL,
    frequency TEXT NOT NULL,
    period_start DATE NOT NULL,
    edition_id TEXT NOT NULL REFERENCES briefing_editions(id),
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sending','sent','retryable','blocked','uncertain')),
    reason TEXT,
    attempts INT NOT NULL DEFAULT 0,
    sent_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (email, edition_date),
    UNIQUE (email, frequency, period_start)
);
CREATE INDEX IF NOT EXISTS briefing_deliveries_pending ON briefing_deliveries(status, edition_date);
COMMIT;
