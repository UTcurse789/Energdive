-- Migration 020: Lightweight newsletter subscribe letterbox
-- Stores email-only newsletter subscriptions from article CTAs and similar forms.

CREATE TABLE IF NOT EXISTS subscribe_letterbox (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location    TEXT,
  ip_address  TEXT,
  source      TEXT NOT NULL DEFAULT 'subscribe_form',
  subscribed_from_url   TEXT,
  subscribed_from_title TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscribe_letterbox_email
  ON subscribe_letterbox (LOWER(email));

CREATE INDEX IF NOT EXISTS idx_subscribe_letterbox_timestamp
  ON subscribe_letterbox ("timestamp" DESC);
