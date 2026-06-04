-- Migration 018: Add has_submitted_paper flag to users table
-- This flag controls visibility of "My Submissions" in the dashboard nav.
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_submitted_paper BOOLEAN DEFAULT false;
