CREATE TABLE IF NOT EXISTS places (
    id TEXT PRIMARY KEY,
    name TEXT,
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

    status TEXT,
    is_verified INTEGER DEFAULT 0,
    verification_status TEXT,

    offer_count INTEGER DEFAULT 0,
    product_count INTEGER DEFAULT 0,

    services_json TEXT,
    social_json TEXT,
    stats_json TEXT,
    working_hours_json TEXT,

    created_at INTEGER,
    updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_places_category
ON places(category_id);

CREATE INDEX IF NOT EXISTS idx_places_area
ON places(area);

CREATE INDEX IF NOT EXISTS idx_places_status
ON places(status);

CREATE INDEX IF NOT EXISTS idx_places_owner
ON places(owner_id);

CREATE INDEX IF NOT EXISTS idx_places_name
ON places(name);

CREATE INDEX IF NOT EXISTS idx_places_slug
ON places(slug);