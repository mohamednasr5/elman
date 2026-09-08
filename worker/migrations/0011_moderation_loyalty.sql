-- 0011: moderation and loyalty fields
-- Turso remains the only application database.

ALTER TABLE products ADD COLUMN rejection_reason TEXT;

ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN total_earned INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN loyalty_json TEXT DEFAULT '{}';
ALTER TABLE users ADD COLUMN last_daily_bonus_date TEXT;
ALTER TABLE users ADD COLUMN last_redemption_at INTEGER;

CREATE TABLE IF NOT EXISTS loyalty_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  rule_key TEXT,
  amount INTEGER NOT NULL,
  label TEXT,
  place_id TEXT,
  place_name TEXT,
  meta_json TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_loyalty_history_user_created ON loyalty_history(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS loyalty_redemptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  place_id TEXT NOT NULL,
  place_name TEXT,
  points_redeemed INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_user ON loyalty_redemptions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS banned_ips (
  ip_key TEXT PRIMARY KEY,
  ip TEXT NOT NULL,
  reason TEXT,
  is_permanent INTEGER DEFAULT 0,
  duration_days INTEGER,
  banned_at INTEGER NOT NULL,
  banned_until INTEGER,
  banned_by TEXT,
  user_id TEXT,
  user_name TEXT
);
CREATE INDEX IF NOT EXISTS idx_banned_ips_until ON banned_ips(banned_until);
