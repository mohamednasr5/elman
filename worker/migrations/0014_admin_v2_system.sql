-- 0014: Admin V2 System Schema (Audit Logs, Notifications History)
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id TEXT PRIMARY KEY,
  admin_uid TEXT NOT NULL,
  admin_email TEXT,
  admin_name TEXT,
  role TEXT,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  details_json TEXT,
  ip TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'success',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_logs(admin_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON admin_audit_logs(resource, resource_id);

CREATE TABLE IF NOT EXISTS admin_notifications_log (
  id TEXT PRIMARY KEY,
  sender_uid TEXT,
  sender_email TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  target_type TEXT,
  target_value TEXT,
  recipient_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notif_created ON admin_notifications_log(created_at DESC);
