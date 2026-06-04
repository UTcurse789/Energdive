-- Migration 019: Rename has_submitted_paper to has_submitted_abstract in users table
-- This supports the new split abstract/final-paper flow.
ALTER TABLE users RENAME COLUMN has_submitted_paper TO has_submitted_abstract;
