-- Derived (disposable)
CREATE TABLE IF NOT EXISTS personal_bests (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  variant TEXT NOT NULL DEFAULT 'classic',
  metric TEXT NOT NULL,
  value REAL NOT NULL,
  session_id UUID REFERENCES sessions(id),
  achieved_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id, game_id, variant, metric)
);

CREATE TABLE IF NOT EXISTS user_game_stats (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  variant TEXT NOT NULL DEFAULT 'classic',
  sessions_count INT NOT NULL DEFAULT 0,
  recent_speed REAL,
  recent_accuracy REAL,
  recent_efficiency REAL,
  normalized_z REAL,
  confidence REAL NOT NULL DEFAULT 0,
  last_played_at TIMESTAMPTZ,
  scoring_version INT NOT NULL DEFAULT 1,
  norms_version INT NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, game_id, variant)
);

CREATE TABLE IF NOT EXISTS domain_scores (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  domain_id TEXT REFERENCES domains(id) ON DELETE CASCADE,
  score REAL NOT NULL DEFAULT 0,
  confidence REAL NOT NULL DEFAULT 0,
  games_contributing INT NOT NULL DEFAULT 0,
  profile_version INT NOT NULL DEFAULT 1,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, domain_id)
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT REFERENCES badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL,
  source_session_id UUID REFERENCES sessions(id),
  revoked_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, badge_id)
);

-- Sync + Ops
CREATE TABLE IF NOT EXISTS user_sync_state (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  change_seq BIGINT NOT NULL DEFAULT 0,
  data_epoch INT NOT NULL DEFAULT 1,
  profile_dirty BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_id UUID,
  PRIMARY KEY (user_id, key)
);

CREATE TABLE IF NOT EXISTS play_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT REFERENCES games(id),
  seed TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS integrity_events (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID,
  user_id UUID,
  rule TEXT NOT NULL,
  severity TEXT NOT NULL,
  detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  device_id UUID,
  payload_hash TEXT,
  counts JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  committed_at TIMESTAMPTZ
);
