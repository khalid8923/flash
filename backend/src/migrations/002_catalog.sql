-- Reference data (seeded by migrations)
CREATE TABLE IF NOT EXISTS domains (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT
);

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain_id TEXT NOT NULL REFERENCES domains(id),
  trial_pattern TEXT NOT NULL,
  primary_metric TEXT NOT NULL,
  metric_direction TEXT NOT NULL CHECK (metric_direction IN ('higher','lower')),
  rt_floor_ms INT,
  rt_ceiling_ms INT,
  max_trials_per_session INT NOT NULL DEFAULT 500,
  min_duration_ms INT NOT NULL DEFAULT 0,
  max_duration_ms INT NOT NULL DEFAULT 3600000,
  max_score INT,
  trial_exclusion_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  game_version TEXT NOT NULL DEFAULT '1.0.0',
  scoring_version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready','wip','disabled'))
);
CREATE INDEX IF NOT EXISTS idx_games_domain ON games(domain_id);

CREATE TABLE IF NOT EXISTS game_domain_weights (
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  domain_id TEXT REFERENCES domains(id) ON DELETE CASCADE,
  weight REAL NOT NULL DEFAULT 1.0,
  PRIMARY KEY (game_id, domain_id)
);

CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('bronze','silver','gold','platinum')),
  rule JSONB NOT NULL,
  rule_version INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS norms (
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  variant TEXT NOT NULL DEFAULT 'classic',
  metric TEXT NOT NULL,
  scoring_version INT NOT NULL,
  mean REAL NOT NULL,
  sd REAL NOT NULL,
  percentiles JSONB,
  sample_size INT NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'seed',
  PRIMARY KEY (game_id, variant, metric, scoring_version)
);
