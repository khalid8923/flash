-- Migration 016: Fix play_tickets schema (R06 fix)
-- Adds missing token_hash column + unique index.
-- NOTE: The v3 schema had: id, user_id, game_id, seed, issued_at, expires_at, consumed_at
-- Migration 015 added: player_id, mode, level, device_id, rejected_at, rejected_reason
-- This migration adds the missing token_hash column that issueTicket() writes to.

ALTER TABLE play_tickets ADD COLUMN IF NOT EXISTS token_hash TEXT;

-- Unique index: one ticket token can only exist once
CREATE UNIQUE INDEX IF NOT EXISTS idx_play_tickets_token_hash
  ON play_tickets(token_hash)
  WHERE token_hash IS NOT NULL;