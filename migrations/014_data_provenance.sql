-- Migration 014: Data Provenance & Consent Management System
-- DPDP Act compliance: consent logging, DPA tracking, provenance fields.
-- All operations are idempotent (safe to re-run).

-- ── 1. consent_log table — Immutable audit trail ─────────────────────────────
CREATE TABLE IF NOT EXISTS consent_log (
    id                        SERIAL PRIMARY KEY,
    user_id                   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    email                     VARCHAR(255) NOT NULL,
    source                    VARCHAR(50) NOT NULL,
    -- source values: show_form | ad_lead | backstage | trade_india | zoho_form
    consent_version           VARCHAR(50) NOT NULL,
    consent_text_snapshot     TEXT NOT NULL,
    opt_in_method             VARCHAR(50) NOT NULL,
    -- opt_in_method values: checkbox | double_optin | api
    ip_address                VARCHAR(45),
    campaign_id               VARCHAR(255),
    third_party_agreement_ref VARCHAR(255),
    consent_purpose           VARCHAR(100) DEFAULT 'registration',
    metadata                  JSONB DEFAULT '{}',
    consent_timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_log_email      ON consent_log(email);
CREATE INDEX IF NOT EXISTS idx_consent_log_user_id    ON consent_log(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_log_source     ON consent_log(source);
CREATE INDEX IF NOT EXISTS idx_consent_log_timestamp  ON consent_log(consent_timestamp);
CREATE INDEX IF NOT EXISTS idx_consent_log_version    ON consent_log(consent_version);

-- ── 2. data_processing_agreements table — DPA tracking ───────────────────────
CREATE TABLE IF NOT EXISTS data_processing_agreements (
    id              SERIAL PRIMARY KEY,
    partner_name    VARCHAR(255) NOT NULL,
    agreement_ref   VARCHAR(255) NOT NULL UNIQUE,
    effective_date  DATE NOT NULL,
    expiry_date     DATE,
    document_url    TEXT,
    status          VARCHAR(30) NOT NULL DEFAULT 'active',
    -- status values: active | expired | pending | terminated
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dpa_partner    ON data_processing_agreements(partner_name);
CREATE INDEX IF NOT EXISTS idx_dpa_status     ON data_processing_agreements(status);

-- ── 3. New provenance columns on users table ─────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_version       VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_timestamp     TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ip_address_at_consent VARCHAR(45);
ALTER TABLE users ADD COLUMN IF NOT EXISTS data_source           VARCHAR(50);
-- data_source values: show_form | ad_lead | backstage | trade_india

-- ── 4. New provenance columns on pending_verifications table ─────────────────
ALTER TABLE pending_verifications ADD COLUMN IF NOT EXISTS consent_version  VARCHAR(50);
ALTER TABLE pending_verifications ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMPTZ;
ALTER TABLE pending_verifications ADD COLUMN IF NOT EXISTS ip_address       VARCHAR(45);
ALTER TABLE pending_verifications ADD COLUMN IF NOT EXISTS campaign_id      VARCHAR(255);

-- ── 5. Backfill: Set data_source for existing users based on source column ───
UPDATE users
SET data_source = CASE
    WHEN source = 'zoho_form'  THEN 'ad_lead'
    WHEN source = 'website'    THEN 'show_form'
    WHEN source = 'backstage'  THEN 'backstage'
    WHEN source = 'trade_india' THEN 'trade_india'
    ELSE 'show_form'
END
WHERE data_source IS NULL;
