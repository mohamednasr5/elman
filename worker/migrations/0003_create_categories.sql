CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT,
    name_en TEXT,
    slug TEXT,
    icon TEXT,
    image_url TEXT,
    description TEXT,
    parent_id TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER,
    updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_categories_slug
ON categories(slug);

CREATE INDEX IF NOT EXISTS idx_categories_parent
ON categories(parent_id);

CREATE INDEX IF NOT EXISTS idx_categories_active
ON categories(is_active);