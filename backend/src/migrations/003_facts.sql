CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_session_id UUID NOT NULL,
  device_id UUID REFERENCES devices(id),
  game_id TEXT NOT NULL REFERENCES games(id),
  domain_id TEXT NOT NULL REFERENCES domains(id),
  mode TEXT NOT NULL CHECK (mode IN ('classic','speed','endless','precision','daily')),
  seed TEXT NOT NULL,
  ticket_id TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  server_received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms INT NOT NULL,
  n_trials INT NOT NULL,
  n_correct INT NOT NULL,
  accuracy REAL NOT NULL,
  median_rt_ms REAL,
  rcs REAL,
  primary_score REAL,
  game_version TEXT NOT NULL,
  scoring_version INT NOT NULL DEFAULT 1,
  trust_tier TEXT NOT NULL DEFAULT 'verified' CHECK (trust_tier IN ('verified','unverified','quarantined')),
  source TEXT NOT NULL DEFAULT 'live' CHECK (source IN ('live','offline','legacy_import')),
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted','quarantined','rejected')),
  anomaly_score REAL DEFAULT 0,
  change_seq BIGINT NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  UNIQUE (user_id, client_session_id)
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_game_time ON sessions(user_id, game_id, ended_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_seq ON sessions(user_id, change_seq);
CREATE INDEX IF NOT EXISTS idx_sessions_pb ON sessions(user_id, game_id, primary_score DESC) WHERE status = 'accepted';

CREATE TABLE IF NOT EXISTS session_trials (
  session_id UUID PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
  trial_schema_version INT NOT NULL DEFAULT 1,
  trials JSONB NOT NULL
);
