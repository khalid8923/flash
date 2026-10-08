-- ═══════════════════════════════════════════════════════════
-- Migration 011 — Fill NULL values in games table
-- Ensures core metadata columns have sane defaults.
-- ═══════════════════════════════════════════════════════════

-- rt_ceiling_ms: max allowed RT before trial is discarded
-- Default: 60 seconds (matches GAME_CATALOG spec)
UPDATE games
   SET rt_ceiling_ms = 60000
 WHERE rt_ceiling_ms IS NULL;

ALTER TABLE games
  ALTER COLUMN rt_ceiling_ms SET DEFAULT 60000,
  ALTER COLUMN rt_ceiling_ms SET NOT NULL;

-- max_score: hard cap for primary_score
-- Default: 100000 (matches GAME_CATALOG spec)
UPDATE games
   SET max_score = 100000
 WHERE max_score IS NULL;

ALTER TABLE games
  ALTER COLUMN max_score SET DEFAULT 100000,
  ALTER COLUMN max_score SET NOT NULL;

-- rt_floor_ms: minimum RT to consider a trial valid
-- Default: 100ms (matches GAME_CATALOG spec)
UPDATE games
   SET rt_floor_ms = 100
 WHERE rt_floor_ms IS NULL;

ALTER TABLE games
  ALTER COLUMN rt_floor_ms SET DEFAULT 100,
  ALTER COLUMN rt_floor_ms SET NOT NULL;

-- Sanity: rt_ceiling_ms must be > rt_floor_ms
DO $$
DECLARE
  bad_count INT;
BEGIN
  SELECT COUNT(*) INTO bad_count
    FROM games
   WHERE rt_ceiling_ms <= rt_floor_ms;

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Data integrity: % games have rt_ceiling_ms <= rt_floor_ms', bad_count;
  END IF;
END $$;