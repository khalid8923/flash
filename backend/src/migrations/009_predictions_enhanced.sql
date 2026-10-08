-- ═══════════════════════════════════════════════════════════
-- Migration 009 — Enhanced Predictions
-- Adds trajectory, confidence bands, risk factors, multi-horizon
-- ═══════════════════════════════════════════════════════════

ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS trajectory TEXT
    CHECK (trajectory IN ('improving', 'plateauing', 'declining', 'volatile', 'unknown')),
  ADD COLUMN IF NOT EXISTS accuracy_slope REAL,
  ADD COLUMN IF NOT EXISTS rt_slope REAL,
  ADD COLUMN IF NOT EXISTS predicted_next_accuracy REAL,
  ADD COLUMN IF NOT EXISTS predicted_accuracy_band REAL,
  ADD COLUMN IF NOT EXISTS r_squared REAL,
  ADD COLUMN IF NOT EXISTS sessions_until_next_level INT,
  ADD COLUMN IF NOT EXISTS sessions_until_max_level INT,
  ADD COLUMN IF NOT EXISTS risk_factors JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS evidence JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS confidence_tier TEXT
    CHECK (confidence_tier IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS sessions_analyzed INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_predictions_user_game_confidence
  ON predictions (user_id, game_id, confidence DESC, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_predictions_trajectory
  ON predictions (user_id, trajectory, computed_at DESC);