-- 039 - Metric Rollups
CREATE TABLE metric_weekly (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  game_id TEXT,
  domain_id TEXT,
  sessions_count INTEGER NOT NULL DEFAULT 0,
  accuracy_avg REAL,
  rt_median_avg REAL,
  rcs_avg REAL,
  pb_count INTEGER NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start, game_id, domain_id)
);
CREATE INDEX idx_metric_weekly_user ON metric_weekly (user_id, week_start DESC);
CREATE TABLE metric_monthly (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_start DATE NOT NULL,
  sessions_count INTEGER NOT NULL DEFAULT 0,
  retention_pct REAL,
  domains_touched INTEGER NOT NULL DEFAULT 0,
  top_domain TEXT,
  weakest_domain TEXT,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, month_start)
);
CREATE INDEX idx_metric_monthly_user ON metric_monthly (user_id, month_start DESC);