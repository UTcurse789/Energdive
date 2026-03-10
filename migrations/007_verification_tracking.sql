-- Migration 007: Add verification state tracking columns
-- Tracks which contact methods (email/phone) have been verified for each user.
-- registration_method records how the user initially signed up ('email' or 'phone').

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_method VARCHAR(10);

-- Backfill: Existing completed users are assumed to have verified email
-- (since the old flow required Clerk email verification or Zoho provisioning).
UPDATE users
SET email_verified = true,
    registration_method = 'email'
WHERE onboarding_completed = true
  AND email_verified = false;
