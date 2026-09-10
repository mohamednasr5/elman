-- Migration 0013: Service Requests, Live Craftsmen On-Call, Village Hub Polls, Appointments

CREATE TABLE IF NOT EXISTS service_requests (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  village TEXT NOT NULL,
  timing TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  user_id TEXT,
  user_name TEXT,
  user_phone TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  offers_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  closed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_village ON service_requests(village);
CREATE INDEX IF NOT EXISTS idx_service_requests_category ON service_requests(category);

CREATE TABLE IF NOT EXISTS craftsman_presence (
  id TEXT PRIMARY KEY,
  place_id TEXT,
  craftsman_name TEXT NOT NULL,
  profession_id TEXT NOT NULL,
  profession_name TEXT NOT NULL,
  is_available_now INTEGER DEFAULT 1,
  coverage_villages_json TEXT,
  inspection_fee TEXT,
  eta_minutes INTEGER DEFAULT 30,
  phone TEXT,
  whatsapp TEXT,
  user_id TEXT,
  available_until INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_craftsman_presence_avail ON craftsman_presence(is_available_now, available_until);

CREATE TABLE IF NOT EXISTS village_polls (
  id TEXT PRIMARY KEY,
  village_id TEXT NOT NULL,
  service_key TEXT NOT NULL,
  service_label TEXT NOT NULL,
  votes_count INTEGER DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS village_votes (
  id TEXT PRIMARY KEY,
  village_id TEXT NOT NULL,
  service_key TEXT NOT NULL,
  voter_fingerprint TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_village_vote_unique ON village_votes(village_id, service_key, voter_fingerprint);

CREATE TABLE IF NOT EXISTS appointment_requests (
  id TEXT PRIMARY KEY,
  place_id TEXT NOT NULL,
  place_name TEXT,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  preferred_date TEXT,
  preferred_time TEXT,
  service_needed TEXT,
  status TEXT DEFAULT 'pending',
  user_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_appointments_place ON appointment_requests(place_id, created_at DESC);
