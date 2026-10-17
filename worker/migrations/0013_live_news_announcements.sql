-- Support system announcements without overloading live-news content fields.
ALTER TABLE live_news ADD COLUMN is_announcement INTEGER NOT NULL DEFAULT 0;
