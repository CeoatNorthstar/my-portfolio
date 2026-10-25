-- Datasets / results / discoveries, their files, and links to posts and papers.

CREATE TABLE IF NOT EXISTS datasets (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'dataset',   -- dataset | result | discovery
  summary      TEXT,
  status       TEXT NOT NULL DEFAULT 'draft',     -- draft | published
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  published_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_datasets_status ON datasets (status, published_at DESC);

CREATE TABLE IF NOT EXISTS dataset_files (
  id         TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL,
  name       TEXT NOT NULL,
  r2_key     TEXT NOT NULL,
  url        TEXT NOT NULL,
  mime       TEXT,
  size       INTEGER,
  position   INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (dataset_id) REFERENCES datasets (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_dataset_files ON dataset_files (dataset_id, position);

CREATE TABLE IF NOT EXISTS dataset_links (
  dataset_id  TEXT NOT NULL,
  target_type TEXT NOT NULL,                     -- post | paper
  target_id   TEXT NOT NULL,
  PRIMARY KEY (dataset_id, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS idx_dataset_links_target ON dataset_links (target_type, target_id);
