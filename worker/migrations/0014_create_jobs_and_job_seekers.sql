-- Migration 0014: Job Seekers & Available Jobs (باحث عن عمل & وظيفة متاحة)
-- Turso authoritative schema for local employment marketplace

CREATE TABLE IF NOT EXISTS job_seekers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  location TEXT NOT NULL,
  profession TEXT NOT NULL,
  experience TEXT,
  description TEXT NOT NULL,
  expected_salary REAL,
  status TEXT DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_job_seekers_status_created ON job_seekers(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_seekers_user ON job_seekers(user_id);
CREATE INDEX IF NOT EXISTS idx_job_seekers_profession ON job_seekers(profession);
CREATE INDEX IF NOT EXISTS idx_job_seekers_location ON job_seekers(location);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workplace_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  location TEXT NOT NULL,
  profession TEXT NOT NULL,
  working_hours REAL NOT NULL,
  salary_type TEXT DEFAULT 'specified',
  salary REAL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_user ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_profession ON jobs(profession);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
