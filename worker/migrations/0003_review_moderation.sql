-- Add moderation fields used by review reporting/admin moderation.
ALTER TABLE reviews ADD COLUMN is_reported INTEGER DEFAULT 0;
ALTER TABLE reviews ADD COLUMN report_count INTEGER DEFAULT 0;
ALTER TABLE reviews ADD COLUMN last_report_reason TEXT;
ALTER TABLE reviews ADD COLUMN reported_at INTEGER;
ALTER TABLE reviews ADD COLUMN last_reporter_name TEXT;
ALTER TABLE reviews ADD COLUMN is_reviewed_by_admin INTEGER DEFAULT 0;
ALTER TABLE reviews ADD COLUMN admin_review_status TEXT;
ALTER TABLE reviews ADD COLUMN admin_review_note TEXT;
ALTER TABLE reviews ADD COLUMN reviewed_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_reviews_reported
  ON reviews(is_reported, created_at DESC);
