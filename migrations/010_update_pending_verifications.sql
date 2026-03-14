-- Migration 010: Update Pending Verifications to store community data
-- Adds support for passing Zoho Lead community selections into the verification flow.

ALTER TABLE pending_verifications ADD COLUMN IF NOT EXISTS communities JSONB;
ALTER TABLE pending_verifications ADD COLUMN IF NOT EXISTS sub_communities JSONB;
