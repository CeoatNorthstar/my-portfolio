-- Sentinel Collective blog/CMS schema

CREATE TABLE IF NOT EXISTS posts (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  excerpt      TEXT,
  body_json    TEXT,                    -- TipTap JSON (source of truth, re-editable)
  body_html    TEXT,                    -- sanitized HTML for fast public render
  cover_url    TEXT,
  type         TEXT NOT NULL DEFAULT 'article',  -- article | research | link
  link_url     TEXT,                    -- for 'link' type posts
  status       TEXT NOT NULL DEFAULT 'draft',    -- draft | published
  featured     INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  published_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts (slug);

CREATE TABLE IF NOT EXISTS media (
  id         TEXT PRIMARY KEY,
  post_id    TEXT,
  kind       TEXT NOT NULL,            -- image | file | video
  r2_key     TEXT NOT NULL,
  url        TEXT NOT NULL,
  filename   TEXT,
  mime       TEXT,
  size       INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_media_post ON media (post_id);

CREATE TABLE IF NOT EXISTS comments (
  id          TEXT PRIMARY KEY,
  post_id     TEXT NOT NULL,
  author_name TEXT NOT NULL,
  body        TEXT NOT NULL,
  approved    INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments (post_id, approved, created_at DESC);

CREATE TABLE IF NOT EXISTS likes (
  id         TEXT PRIMARY KEY,
  post_id    TEXT NOT NULL,
  client_id  TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (post_id, client_id),
  FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_likes_post ON likes (post_id);

CREATE TABLE IF NOT EXISTS favorites (
  id         TEXT PRIMARY KEY,
  post_id    TEXT NOT NULL,
  client_id  TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (post_id, client_id),
  FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_favorites_client ON favorites (client_id);

CREATE TABLE IF NOT EXISTS messages (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  body       TEXT NOT NULL,
  read       INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at DESC);
