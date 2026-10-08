-- ═══════════════════════════════════════════════════════════
-- Migration 010 — Soft Delete + Indexes + Stats fix
-- Adds: games.deleted_at, missing indexes
-- ═══════════════════════════════════════════════════════════

-- ─── Soft delete for games ───
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_reason TEXT;

-- Partial index for active games (used in every WHERE g.status='ready')
CREATE INDEX IF NOT EXISTS idx_games_active
  ON games (domain_id, id)
  WHERE deleted_at IS NULL AND status = 'ready';

-- ─── Missing indexes (from audit Phase 4) ───

-- Critical: used by every AI feature to fetch last N sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_ended
  ON sessions (user_id, ended_at DESC)
  WHERE status = 'accepted' AND deleted_at IS NULL;

-- Used by /ai/variants/game/:gameId
CREATE INDEX IF NOT EXISTS idx_game_variants_parent_lang
  ON game_variants (parent_game_id, language, generated_at DESC);

-- Used by soft-delete-aware queries
CREATE INDEX IF NOT EXISTS idx_sessions_active
  ON sessions (user_id, game_id, ended_at DESC)
  WHERE status = 'accepted' AND deleted_at IS NULL;

-- ─── Stats tables: ensure computed_at is indexed ───
CREATE INDEX IF NOT EXISTS idx_domain_scores_computed
  ON domain_scores (user_id, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_game_stats_last_played
  ON user_game_stats (user_id, last_played_at DESC);