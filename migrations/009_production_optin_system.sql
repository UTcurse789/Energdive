-- Migration 009: Production-Grade Double Opt-In System
-- Fully self-contained — safe to run on a fresh DB or after migration 008.
-- Creates all required tables and columns idempotently.

-- ── 1. Membership ID sequence ────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS membership_id_seq START 153;

-- ── 2. Ensure users table has required columns ───────────────────────────
-- (users table must already exist from initial setup)
ALTER TABLE users ADD COLUMN IF NOT EXISTS source                VARCHAR(50)  DEFAULT 'website';
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status   VARCHAR(30)  DEFAULT 'pending_verification';
ALTER TABLE users ADD COLUMN IF NOT EXISTS crm_lead_id           VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS crm_duplicate_lead_id VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS crm_duplicate_id      VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS brevo_contact_id      VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_id         VARCHAR(30) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_seq        INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS duplicate_created     BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMPTZ DEFAULT NOW();

-- ── 3. pending_verifications table (create if not exists) ────────────────
CREATE TABLE IF NOT EXISTS pending_verifications (
    id                     SERIAL PRIMARY KEY,
    email                  VARCHAR(255) NOT NULL,
    name                   VARCHAR(255),
    phone                  VARCHAR(50),
    company                VARCHAR(255),
    source                 VARCHAR(50)  NOT NULL DEFAULT 'zoho_form',
    verification_status    VARCHAR(30)  NOT NULL DEFAULT 'pending',
    crm_lead_id            VARCHAR(100),
    magic_token            VARCHAR(512),
    magic_token_hash       VARCHAR(128),
    magic_token_expires_at TIMESTAMPTZ,
    token_used             BOOLEAN      DEFAULT false,
    otp_verified           BOOLEAN      DEFAULT false,
    otp_attempts           INTEGER      DEFAULT 0,
    verified_at            TIMESTAMPTZ,
    user_id                INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Add missing columns if table already existed (from migration 008)
ALTER TABLE pending_verifications ADD COLUMN IF NOT EXISTS magic_token_hash       VARCHAR(128);
ALTER TABLE pending_verifications ADD COLUMN IF NOT EXISTS token_used             BOOLEAN DEFAULT false;
ALTER TABLE pending_verifications ADD COLUMN IF NOT EXISTS otp_attempts           INTEGER DEFAULT 0;
ALTER TABLE pending_verifications ADD COLUMN IF NOT EXISTS magic_token_expires_at TIMESTAMPTZ;

-- Indexes (all idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_verifications_email
    ON pending_verifications(email);
CREATE INDEX IF NOT EXISTS idx_pending_verifications_email
    ON pending_verifications(email);
CREATE INDEX IF NOT EXISTS idx_pending_verifications_magic_token
    ON pending_verifications(magic_token);
CREATE INDEX IF NOT EXISTS idx_pv_magic_token_hash
    ON pending_verifications(magic_token_hash);
CREATE INDEX IF NOT EXISTS idx_pending_verifications_status
    ON pending_verifications(verification_status);

-- ── 4. OTP Codes table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_codes (
    id         SERIAL PRIMARY KEY,
    email      VARCHAR(255) NOT NULL,
    otp        VARCHAR(10)  NOT NULL,
    expires_at TIMESTAMPTZ  NOT NULL,
    attempts   INTEGER      NOT NULL DEFAULT 0,
    used       BOOLEAN      NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_email     ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires   ON otp_codes(expires_at);

-- ── 5. System Logs table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_logs (
    id         SERIAL PRIMARY KEY,
    event_type VARCHAR(50)  NOT NULL,
    email      VARCHAR(255),
    detail     TEXT,
    metadata   JSONB,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_event  ON system_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_email  ON system_logs(email);
CREATE INDEX IF NOT EXISTS idx_system_logs_time   ON system_logs(created_at);

-- ── 6. Membership ID auto-assign trigger ────────────────────────────────
CREATE OR REPLACE FUNCTION assign_membership_id_on_verify()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.verification_status = 'verified'
       AND OLD.verification_status <> 'verified'
       AND NEW.membership_id IS NULL THEN
        NEW.membership_seq := nextval('membership_id_seq');
        NEW.membership_id  := 'ENCL-STN-' || NEW.membership_seq::TEXT;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_membership_id ON users;
CREATE TRIGGER trg_assign_membership_id
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION assign_membership_id_on_verify();

-- ── 7. Backfill: mark existing verified users ────────────────────────────
UPDATE users
SET verification_status = 'verified'
WHERE onboarding_completed = true
  AND (verification_status IS NULL OR verification_status = 'pending_verification');

