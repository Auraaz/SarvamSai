CREATE TABLE IF NOT EXISTS darshan_access (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  access_code TEXT,
  passphrase TEXT,
  status TEXT,
  invite_count INTEGER DEFAULT 0,
  max_invites INTEGER DEFAULT 3,
  created_at TEXT,
  last_accessed_at TEXT
);
