-- Migration 0015: Local business articles / blog
-- Turso authoritative storage for owner-authored place articles.

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  place_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  keywords_json TEXT,
  cover_image_url TEXT,
  status TEXT DEFAULT 'published',
  ai_generated INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  published_at INTEGER,
  FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_articles_place_status
  ON articles(place_id, status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_owner_created
  ON articles(owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_status_published
  ON articles(status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_slug
  ON articles(slug);
