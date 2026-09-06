-- Migration 0005: Link places to geographic entity hierarchy
-- Adds locality_id to places (nullable, backfilled only for CAPMAS-verified localities)
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
