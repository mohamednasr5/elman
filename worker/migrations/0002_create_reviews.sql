CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    place_id TEXT NOT NULL,

    user_id TEXT,
    user_name TEXT,
    user_photo TEXT,

    place_name TEXT,
    place_slug TEXT,

    rating INTEGER,
    comment TEXT,

    is_admin_generated INTEGER DEFAULT 0,
    edit_count INTEGER DEFAULT 0,

    created_at INTEGER,
    updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_reviews_place_id
ON reviews(place_id);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id
ON reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_reviews_created_at
ON reviews(created_at);

CREATE INDEX IF NOT EXISTS idx_reviews_rating
ON reviews(rating);