-- 038 - Session Trials Stats
CREATE TABLE session_trials_stats (
  session_id UUID PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  trial_count INTEGER NOT NULL,
  practice_count INTEGER NOT NULL,
  timeout_count INTEGER NOT NULL,
  rt_p10_ms INTEGER,
  rt_p50_ms INTEGER,
  rt_p90_ms INTEGER,
  rt_mean_ms INTEGER,
  rt_stddev_ms INTEGER,
  jsonb_size_b INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_trials_stats_user ON session_trials_stats (user_id, created_at DESC);
CREATE INDEX idx_trials_stats_game ON session_trials_stats (game_id, created_at DESC);