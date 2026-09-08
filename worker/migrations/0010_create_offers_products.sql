-- Turso migration: authoritative offers/products tables
-- Apply to dalilmanzala before deploying the Worker routes.

CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY,
  place_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  old_price REAL DEFAULT 0,
  new_price REAL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  image_url TEXT,
  start_date INTEGER,
  end_date INTEGER,
  status TEXT DEFAULT 'active',
  owner_id TEXT,
  is_verified_place INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER,
  FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_offers_place ON offers(place_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offers_status_dates ON offers(status, end_date DESC);
CREATE INDEX IF NOT EXISTS idx_offers_owner ON offers(owner_id);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  place_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price REAL DEFAULT 0,
  old_price REAL DEFAULT 0,
  image_url TEXT,
  category TEXT,
  sku TEXT,
  in_stock INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  is_approved INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER,
  FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_products_place ON products(place_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_owner_place ON products(place_id, status);
