-- Bound each import statement while assembling the initial snapshot atomically.
CREATE TABLE IF NOT EXISTS cms_seed_chunks (
  seed_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  content TEXT NOT NULL,
  PRIMARY KEY(seed_id,position)
);
