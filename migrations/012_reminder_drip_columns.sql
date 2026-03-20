-- Migration 012: Add reminder & abandoned cart drip tracking columns
-- Supports two email automation systems:
--   1. Weekly verification reminders (users table)
--   2. Abandoned cart drip sequence (pending_verifications table)

-- ── 1. Weekly reminder tracking on users table ───────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS reminder_email_count    INT         DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_reminder_sent_at   TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reminder_week_start     TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reminder_opted_out      BOOLEAN     DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_pending_reminders
    ON users(verification_status, reminder_opted_out)
    WHERE verification_status = 'pending_verification' AND reminder_opted_out = false;

-- ── 2. Abandoned cart drip tracking on pending_verifications table ────────────
ALTER TABLE pending_verifications ADD COLUMN IF NOT EXISTS drip_step         INT         DEFAULT 0;
ALTER TABLE pending_verifications ADD COLUMN IF NOT EXISTS drip_next_send_at TIMESTAMPTZ;
ALTER TABLE pending_verifications ADD COLUMN IF NOT EXISTS drip_opted_out    BOOLEAN     DEFAULT false;
ALTER TABLE pending_verifications ADD COLUMN IF NOT EXISTS drip_started_at   TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_pv_drip_pending
    ON pending_verifications(verification_status, drip_opted_out, drip_next_send_at)
    WHERE verification_status = 'pending' AND drip_opted_out = false;
