-- Turso-only application state for settings and live community news
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS live_news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  status_tag_key TEXT,
  details TEXT,
  city TEXT,
  image_url TEXT,
  phone TEXT,
  inquiry_link TEXT,
  salary TEXT,
  user_id TEXT,
  user_name TEXT,
  user_photo TEXT,
  user_points INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  reactions_json TEXT,
  reacted_users_json TEXT,
  created_at INTEGER NOT NULL,
  published_at INTEGER,
  expires_at INTEGER,
  updated_at INTEGER,
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_live_news_status_created ON live_news(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_news_city_category ON live_news(city, category);
