-- Migration 016: Ad Events tracking table
-- Stores impression and click events for advertisements

CREATE TABLE IF NOT EXISTS ad_events (
  id            SERIAL PRIMARY KEY,
  ad_document_id TEXT NOT NULL,        -- links to Strapi advertisement documentId
  event_type    TEXT NOT NULL,          -- 'impression' or 'click'
  ip_address    TEXT,                   -- for geo lookup
  user_agent    TEXT,                   -- for device detection
  region        TEXT,                   -- resolved from IP (e.g. "Maharashtra")
  device_type   TEXT,                   -- 'Desktop', 'Mobile', 'Tablet'
  referrer      TEXT,                   -- which page the ad was on
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_events_doc_id ON ad_events(ad_document_id);
CREATE INDEX IF NOT EXISTS idx_ad_events_created ON ad_events(created_at);
CREATE INDEX IF NOT EXISTS idx_ad_events_type ON ad_events(event_type);
