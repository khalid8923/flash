-- 032 - User Missions
CREATE TABLE user_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_date DATE NOT NULL,
  mission_key TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  progress_pct REAL NOT NULL DEFAULT 0,
  reward_xp INTEGER NOT NULL DEFAULT 50,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_date, mission_key)
);
CREATE INDEX idx_user_missions_today ON user_missions (user_id, mission_date DESC);
CREATE INDEX idx_user_missions_pending ON user_missions (user_id) WHERE completed_at IS NOT NULL AND claimed_at IS NULL;