-- Migration 021: Store each newsletter subscription attempt as a separate event.
-- Adds source page fields and removes the unique email index created by 020.

DROP INDEX IF EXISTS idx_subscribe_letterbox_email_lower;

ALTER TABLE subscribe_letterbox
  ADD COLUMN IF NOT EXISTS subscribed_from_url TEXT,
  ADD COLUMN IF NOT EXISTS subscribed_from_title TEXT;

CREATE INDEX IF NOT EXISTS idx_subscribe_letterbox_email
  ON subscribe_letterbox (LOWER(email));

CREATE INDEX IF NOT EXISTS idx_subscribe_letterbox_timestamp
  ON subscribe_letterbox ("timestamp" DESC);
