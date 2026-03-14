-- Migration 008: Double Opt-In Verification + Membership ID
-- Adds source tracking, verification_status lifecycle, crm_lead columns,
-- pending_verifications table, and membership_id generation.

-- ── 1. Extend users table ────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'website';
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30) DEFAULT 'pending_verification';
ALTER TABLE users ADD COLUMN IF NOT EXISTS crm_lead_id VARCHAR(100);               -- original (form) lead ID
ALTER TABLE users ADD COLUMN IF NOT EXISTS crm_duplicate_lead_id VARCHAR(100);     -- ITEN MEDIA lead (post-verify)
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_id VARCHAR(30) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_seq INTEGER;                 -- raw auto-increment

-- Backfill verified users to 'verified' status
UPDATE users
SET verification_status = 'verified'
WHERE onboarding_completed = true
  AND verification_status = 'pending_verification';

-- ── 2. Membership ID sequence ────────────────────────────────────────
-- Starts at 153 (matching ENCL-STN-153 format from the spec)
CREATE SEQUENCE IF NOT EXISTS membership_id_seq START 153;

-- ── 3. Pending verifications table ──────────────────────────────────
-- Holds unverified leads coming from Zoho Forms (before OTP confirmation).
-- Once verified, the row updates and the duplicate CRM lead is created.
CREATE TABLE IF NOT EXISTS pending_verifications (
    id               SERIAL PRIMARY KEY,
    email            VARCHAR(255) NOT NULL,
    phone            VARCHAR(50),
    name             VARCHAR(255),
    company          VARCHAR(255),
    source           VARCHAR(50)  NOT NULL DEFAULT 'zoho_form',
    verification_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    crm_lead_id      VARCHAR(100),            -- original Zoho Form lead ID
    magic_token      VARCHAR(512) UNIQUE,
    magic_token_expires_at TIMESTAMPTZ,
    otp_verified     BOOLEAN      DEFAULT false,
    verified_at      TIMESTAMPTZ,
    user_id          INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_verifications_email       ON pending_verifications(email);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_verifications_email ON pending_verifications(email);
CREATE INDEX IF NOT EXISTS idx_pending_verifications_magic_token ON pending_verifications(magic_token);
CREATE INDEX IF NOT EXISTS idx_pending_verifications_status      ON pending_verifications(verification_status);

-- ── 4. Membership ID helper function ────────────────────────────────
CREATE OR REPLACE FUNCTION generate_membership_id()
RETURNS TEXT AS $$
DECLARE
    seq_val INTEGER;
BEGIN
    seq_val := nextval('membership_id_seq');
    RETURN 'ENCL-STN-' || seq_val::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ── 5. Trigger: auto-assign membership_id when verification_status → 'verified' ──
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