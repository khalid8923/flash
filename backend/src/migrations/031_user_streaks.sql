-- 031 - User Streaks with Freeze Tokens
CREATE TABLE user_streaks (
  user_id            UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak     INTEGER NOT NULL DEFAULT 0,
  longest_streak     INTEGER NOT NULL DEFAULT 0,
  last_active_date   DATE,
  freeze_tokens      INTEGER NOT NULL DEFAULT 0,
  freeze_max         INTEGER NOT NULL DEFAULT 3,
  freezes_used_total INTEGER NOT NULL DEFAULT 0,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_streaks_active ON user_streaks (last_active_date DESC) WHERE current_streak > 0;
CREATE TABLE streak_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  streak_value INTEGER,
  delta INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_streak_events_user_time ON streak_events (user_id, created_at DESC);