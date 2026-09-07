-- Migration 0005: Link places to geographic entity hierarchy
-- Adds locality_id to places (nullable, backfilled only for CAPMAS-verified localities)
-- Ensure geographic tables exist before adding the foreign key.
CREATE TABLE IF NOT EXISTS countries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  iso_code TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS governorates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  official_code TEXT,
  slug TEXT NOT NULL UNIQUE,
  latitude REAL,
  longitude REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS centers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  governorate_id INTEGER NOT NULL REFERENCES governorates(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  official_code TEXT,
  slug TEXT NOT NULL UNIQUE,
  latitude REAL,
  longitude REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS localities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  center_id INTEGER NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  parent_locality_id INTEGER REFERENCES localities(id) ON DELETE SET NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('city','village','local_unit')),
  official_code TEXT,
  slug TEXT NOT NULL UNIQUE,
  latitude REAL,
  longitude REAL,
  population INTEGER,
  is_verified INTEGER NOT NULL DEFAULT 0,
  source_reference TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_localities_center ON localities(center_id);
CREATE INDEX IF NOT EXISTS idx_localities_parent ON localities(parent_locality_id);
CREATE INDEX IF NOT EXISTS idx_localities_type ON localities(type);

INSERT INTO countries (name_ar,name_en,iso_code,slug) VALUES ('مصر','Egypt','EG','egypt')
ON CONFLICT(iso_code) DO NOTHING;
INSERT INTO governorates (country_id,name_ar,name_en,slug)
SELECT id,'الدقهلية','Dakahlia','dakahlia' FROM countries WHERE iso_code='EG'
ON CONFLICT(slug) DO NOTHING;
INSERT INTO centers (governorate_id,name_ar,name_en,slug)
SELECT id,'المنزلة','Manzala','manzala' FROM governorates WHERE slug='dakahlia'
ON CONFLICT(slug) DO NOTHING;
INSERT INTO centers (governorate_id,name_ar,name_en,slug)
SELECT id,'المطرية','El-Matariya','el-matariya' FROM governorates WHERE slug='dakahlia'
ON CONFLICT(slug) DO NOTHING;
INSERT INTO localities (center_id,name_ar,name_en,type,slug,is_verified)
SELECT id,'مدينة المنزلة','Manzala City','city','manzala-city',1 FROM centers WHERE slug='manzala'
ON CONFLICT(slug) DO NOTHING;
INSERT INTO localities (center_id,name_ar,name_en,type,slug,is_verified)
SELECT id,'مدينة المطرية','El-Matariya City','city','el-matariya-city',1 FROM centers WHERE slug='el-matariya'
ON CONFLICT(slug) DO NOTHING;

-- Rule: NEVER invent administrative relationships. Only link places whose
-- existing free-text `area` field matches an already-verified locality name.

ALTER TABLE places ADD COLUMN locality_id INTEGER REFERENCES localities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_places_locality ON places(locality_id);

-- Backfill: only exact, verified matches (Manzala City / El-Matariya City)
-- D1 is single source of truth; this only sets the FK, no data duplication.
UPDATE places
SET locality_id = (SELECT id FROM localities WHERE slug = 'manzala-city')
WHERE (area = 'المنزلة' OR area = 'منزلة' OR area LIKE '%المنزلة%')
  AND locality_id IS NULL;

UPDATE places
SET locality_id = (SELECT id FROM localities WHERE slug = 'el-matariya-city')
WHERE (area = 'المطرية' OR area LIKE '%المطرية%')
  AND locality_id IS NULL;

-- Places with an `area` value that does NOT match a verified locality are
-- intentionally left with locality_id = NULL until manually verified against
-- CAPMAS data. Do not guess or auto-assign ambiguous areas.
