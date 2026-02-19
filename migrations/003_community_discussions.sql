CREATE TABLE IF NOT EXISTS community_posts (
    id            SERIAL PRIMARY KEY,
    community_id  INTEGER NOT NULL,
    clerk_user_id TEXT NOT NULL,
    author_name   TEXT NOT NULL,
    content       TEXT NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_comments (
    id            SERIAL PRIMARY KEY,
    post_id       INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,
    author_name   TEXT NOT NULL,
    content       TEXT NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_community ON community_posts(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON community_comments(post_id, created_at ASC);
