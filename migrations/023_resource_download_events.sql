-- Migration 023: Resource Center download audit trail
-- Stores who downloaded which CMS resource, when, and from where.

CREATE TABLE IF NOT EXISTS resource_download_events (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             INTEGER REFERENCES users(id) ON DELETE SET NULL,
    clerk_id            TEXT NOT NULL,
    email               TEXT NOT NULL,
    first_name          TEXT,
    last_name           TEXT,
    phone               TEXT,
    company             TEXT,
    job_title           TEXT,

    resource_slug       TEXT NOT NULL,
    resource_title      TEXT NOT NULL,
    resource_type       TEXT,
    resource_show       TEXT,
    resource_event_name TEXT,
    resource_year       INTEGER,
    resource_file_name  TEXT,
    resource_file_url   TEXT,

    download_source     TEXT,
    source_url          TEXT,
    landing_page_url    TEXT,
    referrer_url        TEXT,
    request_referrer_url TEXT,
    origin_url          TEXT,
    utm_source          TEXT,
    utm_medium          TEXT,
    utm_campaign        TEXT,
    utm_term            TEXT,
    utm_content         TEXT,

    ip_address          TEXT,
    user_agent          TEXT,
    city                TEXT,
    region              TEXT,
    country             TEXT,
    country_code        TEXT,
    postal              TEXT,
    latitude            NUMERIC,
    longitude           NUMERIC,
    timezone            TEXT,
    org                 TEXT,
    geo                 JSONB,

    downloaded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_download_events_email
  ON resource_download_events (LOWER(email), downloaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_resource_download_events_clerk
  ON resource_download_events (clerk_id, downloaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_resource_download_events_resource
  ON resource_download_events (resource_slug, downloaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_resource_download_events_source
  ON resource_download_events (download_source, downloaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_resource_download_events_time
  ON resource_download_events (downloaded_at DESC);
