-- Migration 013: Add salutation column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS salutation VARCHAR(20);
