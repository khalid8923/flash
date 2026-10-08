-- Migration 015: Play-ticket v2 (R06)
-- Adds scope + TTL + tracking columns for single-use tickets.

ALTER TABLE play_tickets ADD COLUMN IF NOT EXISTS game_id TEXT;
ALTER TABLE play_tickets ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'classic';
ALTER TABLE play_tickets ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;
ALTER TABLE play_tickets ADD COLUMN IF NOT EXISTS player_id UUID;
ALTER TABLE play_tickets ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE play_tickets ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMPTZ;
ALTER TABLE play_tickets ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE play_tickets ADD COLUMN IF NOT EXISTS rejected_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_tickets_player_unused
  ON play_tickets(player_id, issued_at DESC)
  WHERE consumed_at IS NULL AND rejected_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_expires
  ON play_tickets(expires_at)
  WHERE consumed_at IS NULL AND rejected_at IS NULL;