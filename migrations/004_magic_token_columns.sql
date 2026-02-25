-- 004: Add magic_token columns to users table for Zoho provisioning
-- These columns store one-time-use magic login tokens generated during provisioning.

ALTER TABLE users ADD COLUMN IF NOT EXISTS magic_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS magic_token_expires_at TIMESTAMPTZ;

-- Partial index for fast token lookups (only indexes non-null tokens)
CREATE INDEX IF NOT EXISTS idx_users_magic_token
  ON users (magic_token)
  WHERE magic_token IS NOT NULL;
