-- Adds a dedicated flag for system announcements stored in live_news.
-- The deployment repair script applies this idempotently for existing Turso databases.
ALTER TABLE live_news ADD COLUMN is_announcement INTEGER NOT NULL DEFAULT 0;
