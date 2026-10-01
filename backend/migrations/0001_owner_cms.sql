-- Dedicated CMS database. No existing site tables are changed.
CREATE TABLE IF NOT EXISTS cms_accounts (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS cms_sessions (
  token_hash TEXT PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES cms_accounts(id),
  csrf_token TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS cms_sessions_expiry ON cms_sessions(expires_at);
CREATE TABLE IF NOT EXISTS cms_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  draft_revision INTEGER NOT NULL DEFAULT 0,
  draft_json TEXT NOT NULL,
  published_revision INTEGER,
  published_json TEXT,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS cms_revisions (
  revision INTEGER PRIMARY KEY,
  content_json TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  published_at INTEGER
);
CREATE TABLE IF NOT EXISTS cms_media (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  preview_mime TEXT NOT NULL,
  preview_size INTEGER NOT NULL,
  original_uploaded INTEGER NOT NULL DEFAULT 0,
  preview_uploaded INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS cms_rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
