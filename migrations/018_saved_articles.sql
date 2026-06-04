CREATE TABLE IF NOT EXISTS saved_articles (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  url        TEXT NOT NULL,
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_articles_user_url
  ON saved_articles (user_id, url);

CREATE INDEX IF NOT EXISTS idx_saved_articles_user_saved_at
  ON saved_articles (user_id, saved_at DESC);
