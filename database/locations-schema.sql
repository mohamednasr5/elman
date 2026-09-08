-- =====================================================================
-- Geographic Entity Hierarchy Schema
-- Dalil Manzala & El-Matariya - Local Business Directory
-- Hierarchy: Country > Governorate > Center (Markaz) > City/Village/Local Unit
-- Single Source of Truth: Turso
-- =====================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- 1. Countries
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS countries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  iso_code TEXT NOT NULL UNIQUE,      -- e.g. 'EG'
  slug TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 2. Governorates (Muhafazah)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS governorates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  official_code TEXT,                 -- CAPMAS governorate code
  slug TEXT NOT NULL UNIQUE,
  latitude REAL,
  longitude REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_governorates_country ON governorates(country_id);

-- ---------------------------------------------------------------------
-- 3. Centers (Markaz / Qism) - administrative subdivision of governorate
-- ---------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_centers_governorate ON centers(governorate_id);

-- ---------------------------------------------------------------------
-- 4. Localities (City / Village / Local Unit) - leaf-level geographic node
--    type: 'city' | 'village' | 'local_unit'
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS localities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  center_id INTEGER NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  parent_locality_id INTEGER REFERENCES localities(id) ON DELETE SET NULL, -- for villages under a local unit
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('city','village','local_unit')),
  official_code TEXT,
  slug TEXT NOT NULL UNIQUE,
  latitude REAL,
  longitude REAL,
  population INTEGER,
  is_verified INTEGER NOT NULL DEFAULT 0,  -- 1 = confirmed against official source
  source_reference TEXT,                    -- e.g. CAPMAS document / official gazette
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_localities_center ON localities(center_id);
CREATE INDEX IF NOT EXISTS idx_localities_parent ON localities(parent_locality_id);
CREATE INDEX IF NOT EXISTS idx_localities_type ON localities(type);

-- ---------------------------------------------------------------------
-- 5. Link table: businesses -> localities (many businesses per locality)
--    Assumes an existing 'businesses' table (id INTEGER PRIMARY KEY)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL,
  locality_id INTEGER NOT NULL REFERENCES localities(id) ON DELETE RESTRICT,
  address_line TEXT,
  latitude REAL,
  longitude REAL,
  is_primary INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_business_locations_business ON business_locations(business_id);
CREATE INDEX IF NOT EXISTS idx_business_locations_locality ON business_locations(locality_id);

-- ---------------------------------------------------------------------
-- 6. Seed: Egypt / Dakahlia / El-Matariya & Manzala centers
--    NOTE: Only verified official names inserted. Village-level data
--    must be populated separately after verification against CAPMAS.
-- ---------------------------------------------------------------------
INSERT INTO countries (name_ar, name_en, iso_code, slug)
VALUES ('مصر', 'Egypt', 'EG', 'egypt')
ON CONFLICT(iso_code) DO NOTHING;

INSERT INTO governorates (country_id, name_ar, name_en, slug)
SELECT id, 'الدقهلية', 'Dakahlia', 'dakahlia' FROM countries WHERE iso_code = 'EG'
ON CONFLICT(slug) DO NOTHING;

INSERT INTO centers (governorate_id, name_ar, name_en, slug)
SELECT id, 'المنزلة', 'Manzala', 'manzala' FROM governorates WHERE slug = 'dakahlia'
ON CONFLICT(slug) DO NOTHING;

INSERT INTO centers (governorate_id, name_ar, name_en, slug)
SELECT id, 'المطرية', 'El-Matariya', 'el-matariya' FROM governorates WHERE slug = 'dakahlia'
ON CONFLICT(slug) DO NOTHING;

INSERT INTO localities (center_id, name_ar, name_en, type, slug, is_verified)
SELECT id, 'مدينة المنزلة', 'Manzala City', 'city', 'manzala-city', 1 FROM centers WHERE slug = 'manzala'
ON CONFLICT(slug) DO NOTHING;

INSERT INTO localities (center_id, name_ar, name_en, type, slug, is_verified)
SELECT id, 'مدينة المطرية', 'El-Matariya City', 'city', 'el-matariya-city', 1 FROM centers WHERE slug = 'el-matariya'
ON CONFLICT(slug) DO NOTHING;
