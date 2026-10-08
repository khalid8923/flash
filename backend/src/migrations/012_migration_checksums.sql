-- Migration 012: Add checksum column for integrity verification (R24)
-- See migrate.ts -- every applied migration's SHA-256 is stored here.
-- Applied migrations must never be modified afterward.

ALTER TABLE _migrations
  ADD COLUMN IF NOT EXISTS checksum TEXT;