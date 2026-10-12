-- 048 - Achievements (long-term, bigger than badges)
CREATE TABLE achievement_definitions (
  id TEXT PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  icon TEXT NOT NULL,
  tier TEXT NOT NULL,
  rule JSONB NOT NULL,
  reward_xp INTEGER NOT NULL DEFAULT 100,
  hidden BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE user_achievements (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  PRIMARY KEY (user_id, achievement_id)
);
CREATE INDEX idx_user_achievements_user ON user_achievements (user_id, unlocked_at DESC);