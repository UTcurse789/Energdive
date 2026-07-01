-- Migration 024: Third-party Resource Center email notification audit log
-- Tracks Brevo template emails sent to third-party show/event owners.

CREATE TABLE IF NOT EXISTS resource_third_party_email_notifications (
    id                  BIGSERIAL PRIMARY KEY,
    download_event_id   BIGINT REFERENCES resource_download_events(id) ON DELETE SET NULL,
    template_id         INTEGER NOT NULL,
    recipient_email     TEXT,
    show_code           TEXT,
    resource_slug       TEXT NOT NULL,
    resource_title      TEXT NOT NULL,
    user_email          TEXT NOT NULL,
    status              TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
    message_id          TEXT,
    error_message       TEXT,
    params              JSONB,
    sent_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_third_party_email_notifications_download
  ON resource_third_party_email_notifications (download_event_id);

CREATE INDEX IF NOT EXISTS idx_resource_third_party_email_notifications_recipient
  ON resource_third_party_email_notifications (LOWER(recipient_email), created_at DESC);

CREATE INDEX IF NOT EXISTS idx_resource_third_party_email_notifications_show
  ON resource_third_party_email_notifications (show_code, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_resource_third_party_email_notifications_status
  ON resource_third_party_email_notifications (status, created_at DESC);
