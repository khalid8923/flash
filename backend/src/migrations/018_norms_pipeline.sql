-- Migration 018: Norms pipeline (R34)
-- Adds versioning + status to `norms` table.

ALTER TABLE norms ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'candidate';
ALTER TABLE norms ADD COLUMN IF NOT EXISTS norm_version INT DEFAULT 1;
ALTER TABLE norms ADD COLUMN IF NOT EXISTS sample_size INT;
ALTER TABLE norms ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Only one published row per (game, variant, metric)
CREATE UNIQUE INDEX IF NOT EXISTS uq_norms_published
  ON norms(game_id, variant, metric)
  WHERE status = 'published';