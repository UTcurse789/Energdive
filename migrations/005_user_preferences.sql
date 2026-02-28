-- Migration 005: Add subscription preference columns to users table
-- preferred_frequency: single choice (daily, weekly, monthly)
-- preferred_formats:   multi-select stored as a PostgreSQL text array

ALTER TABLE users
ADD COLUMN IF NOT EXISTS preferred_frequency VARCHAR(20) DEFAULT 'daily';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS preferred_formats TEXT[] DEFAULT '{}';
