-- Track the exact start time of a place's paid featured-ad period.
-- Existing rows remain compatible; the dashboard falls back to
-- sponsored_until - 30 days for legacy active ads that have no start timestamp.
ALTER TABLE places ADD COLUMN sponsored_at INTEGER;
