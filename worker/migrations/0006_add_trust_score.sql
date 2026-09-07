-- Migration 0006: Admin-controlled per-place trust score (0-100)
ALTER TABLE places ADD COLUMN trust_score INTEGER DEFAULT 0;

UPDATE places SET trust_score = NULL;
