-- Migration 017: Create user_downloads tracking table
CREATE TABLE IF NOT EXISTS user_downloads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    paper_slug VARCHAR(255) NOT NULL,
    paper_title TEXT NOT NULL,
    pdf_url TEXT NOT NULL,
    downloaded_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_paper_download UNIQUE (user_id, paper_slug)
);

CREATE INDEX IF NOT EXISTS idx_user_downloads_user ON user_downloads(user_id, downloaded_at DESC);
