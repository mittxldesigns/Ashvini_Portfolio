-- Additive helper tables only. Owner content and original media stay unchanged.
CREATE TABLE IF NOT EXISTS cms_helper_pairings (
  code_hash TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS cms_helper_devices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  paused INTEGER NOT NULL DEFAULT 0,
  local_paused INTEGER NOT NULL DEFAULT 0,
  model_status TEXT NOT NULL DEFAULT 'missing',
  revoked_at INTEGER,
  last_seen_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS cms_thumbnail_jobs (
  id TEXT PRIMARY KEY,
  project_id INTEGER NOT NULL,
  source_fingerprint TEXT NOT NULL,
  input_key TEXT NOT NULL,
  input_sha256 TEXT NOT NULL,
  input_mime TEXT NOT NULL,
  input_bytes INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('queued','working','ready','failed','stale')),
  device_id TEXT REFERENCES cms_helper_devices(id),
  lease_hash TEXT,
  lease_expires_at INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0,
  result_key TEXT,
  result_sha256 TEXT,
  result_bytes INTEGER,
  result_width INTEGER,
  result_height INTEGER,
  error_code TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(project_id,source_fingerprint)
);
CREATE INDEX IF NOT EXISTS cms_thumbnail_jobs_queue ON cms_thumbnail_jobs(status,created_at);
CREATE UNIQUE INDEX IF NOT EXISTS cms_thumbnail_jobs_device_lease ON cms_thumbnail_jobs(device_id) WHERE status='working';
