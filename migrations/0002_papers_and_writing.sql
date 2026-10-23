-- Research papers, blog sources/keywords, and comment rate-limit columns.

CREATE TABLE IF NOT EXISTS papers (
  id              TEXT PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  authors         TEXT NOT NULL DEFAULT 'Naol Demisse',
  abstract        TEXT,
  references_json TEXT,                 -- [{ text, url }] auto-extracted from the PDF
  keywords        TEXT,                 -- comma-separated terms used for internal linking
  pdf_key         TEXT,                 -- R2 object key
  pdf_url         TEXT,
  pdf_name        TEXT,
  pdf_size        INTEGER,
  page_count      INTEGER,
  status          TEXT NOT NULL DEFAULT 'draft',   -- draft | published
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  published_at    INTEGER
);
CREATE INDEX IF NOT EXISTS idx_papers_status ON papers (status, published_at DESC);

ALTER TABLE posts ADD COLUMN sources_json TEXT;      -- [{ title, url }]
ALTER TABLE posts ADD COLUMN keywords TEXT;          -- comma-separated terms used for internal linking
ALTER TABLE posts ADD COLUMN reading_minutes INTEGER;

ALTER TABLE comments ADD COLUMN client_id TEXT;
ALTER TABLE comments ADD COLUMN ip_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_comments_ip ON comments (ip_hash, created_at);

ALTER TABLE messages ADD COLUMN ip_hash TEXT;
