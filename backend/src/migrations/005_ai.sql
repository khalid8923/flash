CREATE TABLE IF NOT EXISTS user_cognitive_profile (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  domain_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  learning_rate REAL,
  consistency REAL,
  profile_version INT NOT NULL DEFAULT 1,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_recommendation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  user_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_recs_user_time ON ai_recommendation_log(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS adaptive_difficulty_state (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  current_difficulty INT NOT NULL DEFAULT 1,
  target_difficulty INT NOT NULL DEFAULT 1,
  adjustments JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, game_id)
);

CREATE TABLE IF NOT EXISTS generated_content_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  difficulty INT NOT NULL,
  content_hash TEXT NOT NULL,
  content JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_count INT NOT NULL DEFAULT 0,
  UNIQUE (game_id, difficulty, content_hash)
);
CREATE INDEX IF NOT EXISTS idx_gen_cache_lookup ON generated_content_cache(game_id, difficulty, used_count);
