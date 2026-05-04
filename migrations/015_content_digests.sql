-- Migration 015: Preference-based content digests
-- Adds local delivery controls for onboarding subscription preferences
-- and a log table for audit/debugging of personalized digest sends.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_content_digest_sent_at TIMESTAMPTZ;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS content_digest_opted_out BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_content_digest_candidates
    ON users(preferred_frequency, content_digest_opted_out, last_content_digest_sent_at)
    WHERE onboarding_completed = true
      AND verification_status = 'verified'
      AND content_digest_opted_out = false;

CREATE TABLE IF NOT EXISTS content_digest_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    frequency VARCHAR(20) NOT NULL,
    formats TEXT[] NOT NULL DEFAULT '{}',
    item_keys TEXT[] NOT NULL DEFAULT '{}',
    item_count INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'sent',
    error TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_digest_logs_user_sent_at
    ON content_digest_logs(user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_digest_logs_email_sent_at
    ON content_digest_logs(email, sent_at DESC);
