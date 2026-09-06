-- Community data-quality reports
CREATE TABLE IF NOT EXISTS place_reports (
  id TEXT PRIMARY KEY,
  place_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  reporter_name TEXT,
  status TEXT DEFAULT 'new',
  created_at INTEGER NOT NULL,
  reviewed_at INTEGER,
  reviewed_by TEXT,
  FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_place_reports_status_created
  ON place_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_place_reports_place
  ON place_reports(place_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_places_verified_updated
  ON places(is_verified, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_places_sponsored_priority
  ON places(is_sponsored, is_featured, priority DESC, updated_at DESC);
