-- Dalil Manzala - Cloudflare D1 Schema & Indexes
-- Run with: npx wrangler d1 execute dalilmanzala-db --file=worker/schema.sql

CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT UNIQUE,
  category_id TEXT,
  subcategory_id TEXT,
  custom_category TEXT,
  address TEXT,
  area TEXT,
  phone TEXT,
  whatsapp TEXT,
  maps_link TEXT,
  latitude REAL,
  longitude REAL,
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  owner_id TEXT,
  owner_email TEXT,
  status TEXT DEFAULT 'published',
  is_verified INTEGER DEFAULT 0,
  verification_status TEXT DEFAULT 'unverified',
  offer_count INTEGER DEFAULT 0,
  product_count INTEGER DEFAULT 0,
  services_json TEXT,
  social_json TEXT,
  stats_json TEXT,
  working_hours_json TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

-- Essential indexes to prevent Full Table Scans and minimize D1 rows read
CREATE INDEX IF NOT EXISTS idx_places_slug ON places(slug);
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category_id);
CREATE INDEX IF NOT EXISTS idx_places_area ON places(area);
CREATE INDEX IF NOT EXISTS idx_places_status ON places(status);
CREATE INDEX IF NOT EXISTS idx_places_name ON places(name);
CREATE INDEX IF NOT EXISTS idx_places_updated ON places(updated_at DESC);

-- ── 2. Categories & Taxonomy ────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT UNIQUE,
  icon TEXT,
  description TEXT,
  color TEXT,
  "order" INTEGER DEFAULT 0,
  place_count INTEGER DEFAULT 0,
  created_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories("order" ASC);

-- ── 3. Reviews & Ratings ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  place_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_photo TEXT,
  rating REAL NOT NULL,
  comment TEXT,
  status TEXT DEFAULT 'published',
  likes INTEGER DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER,
  FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reviews_place ON reviews(place_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- ── 4. FCM Device Tokens for Web Push ───────────────────────────
CREATE TABLE IF NOT EXISTS fcm_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  platform TEXT,
  user_agent TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_fcm_user ON fcm_tokens(user_id);
