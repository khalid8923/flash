-- Difficulty Atlas: per-game lever definitions + calibrated difficulty
CREATE TABLE IF NOT EXISTS difficulty_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'classic',
  level INT NOT NULL,
  label TEXT NOT NULL,
  levers JSONB NOT NULL,
  calibrated_difficulty REAL NOT NULL DEFAULT 0.5,
  domain_loadings JSONB NOT NULL DEFAULT '{}'::jsonb,
  min_sessions INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (game_id, mode, level)
);

CREATE INDEX IF NOT EXISTS idx_diff_config_game ON difficulty_configs(game_id, mode, level);

-- Player ability per game (updated after each session)
CREATE TABLE IF NOT EXISTS player_game_ability (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'classic',
  ability REAL NOT NULL DEFAULT 0.5,
  uncertainty REAL NOT NULL DEFAULT 0.5,
  evidence_count INT NOT NULL DEFAULT 0,
  current_level INT NOT NULL DEFAULT 1,
  consecutive_successes INT NOT NULL DEFAULT 0,
  consecutive_failures INT NOT NULL DEFAULT 0,
  last_session_id UUID,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, game_id, mode)
);

CREATE INDEX IF NOT EXISTS idx_ability_user ON player_game_ability(user_id);

-- Engine decisions log (for explainability + audit)
CREATE TABLE IF NOT EXISTS engine_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  game_id TEXT REFERENCES games(id),
  reason_code TEXT NOT NULL,
  mode TEXT NOT NULL,
  from_level INT,
  to_level INT,
  predicted_success REAL,
  chosen_level INT,
  policy_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_engine_dec_user ON engine_decisions(user_id, created_at DESC);