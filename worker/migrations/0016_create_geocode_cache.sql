-- Migration 0016: Cached geocoding results for address-to-map resolution

CREATE TABLE IF NOT EXISTS geocode_cache (
  query_key TEXT PRIMARY KEY,
  query_text TEXT NOT NULL,
  provider TEXT NOT NULL,
  result_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_geocode_cache_updated
  ON geocode_cache(updated_at DESC);
