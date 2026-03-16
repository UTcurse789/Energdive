-- Migration 011: Enrich pending_verifications for full lead data
-- Stores all Zoho Form fields so they're available at onboarding time.
-- Also adds sync tracking columns to users table.

-- ── 1. Enrichment fields on pending_verifications ─────────────────────────────
ALTER TABLE pending_verifications ADD COLUMN IF NOT EXISTS job_title        VARCHAR(255);
ALTER TABLE pending_verifications ADD COLUMN IF NOT EXISTS industry         VARCHAR(255);
ALTER TABLE pending_verifications ADD COLUMN IF NOT EXISTS community_portal TEXT;  -- JSON array as comma-separated string
ALTER TABLE pending_verifications ADD COLUMN IF NOT EXISTS city             VARCHAR(255);
ALTER TABLE pending_verifications ADD COLUMN IF NOT EXISTS country          VARCHAR(255);
ALTER TABLE pending_verifications ADD COLUMN IF NOT EXISTS sync_status      VARCHAR(30) DEFAULT 'pending';
-- sync_status values: pending | brevo_synced | crm_synced | complete | error

-- ── 2. Sync tracking on users table ──────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS brevo_synced_at    TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS crm_synced_at      TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sync_status        VARCHAR(30) DEFAULT 'pending';
-- sync_status values: pending | brevo_synced | crm_synced | complete | error

CREATE INDEX IF NOT EXISTS idx_users_sync_status ON users(sync_status);

-- ── 3. Backfill: Mark users who already completed onboarding as 'complete' ───
UPDATE users
SET sync_status = 'complete'
WHERE onboarding_completed = true
  AND verification_status = 'verified'
  AND (sync_status IS NULL OR sync_status = 'pending');
