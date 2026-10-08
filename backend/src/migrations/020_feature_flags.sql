-- Migration 020: Feature flags (M9-01)
-- Simple table: key + enabled + rollout + description + owner + expires_at.

CREATE TABLE IF NOT EXISTS feature_flags (
  key          TEXT PRIMARY KEY,
  enabled      BOOLEAN NOT NULL DEFAULT false,
  rollout_pct  INT NOT NULL DEFAULT 100 CHECK (rollout_pct BETWEEN 0 AND 100),
  description  TEXT NULL,
  owner        TEXT NULL,
  expires_at   TIMESTAMPTZ NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by   UUID NULL REFERENCES admin_users(id)
);

-- Seed a couple of kill switches (safe defaults)
INSERT INTO feature_flags (key, enabled, rollout_pct, description, owner)
VALUES
  ('ai_chat_enabled', true, 100, 'Kill switch for AI Coach Chat', 'system'),
  ('ai_nudge_enabled', true, 100, 'Kill switch for in-game nudge', 'system'),
  ('ai_lessons_enabled', true, 100, 'Kill switch for micro-lessons', 'system'),
  ('sync_enabled', true, 100, 'Kill switch for sync endpoints', 'system'),
  ('daily_plan_enabled', true, 100, 'Kill switch for AI daily plan', 'system')
ON CONFLICT (key) DO NOTHING;