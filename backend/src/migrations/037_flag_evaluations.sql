-- 037 - Feature Flag Evaluations
CREATE TABLE feature_flag_evaluations (
  id BIGSERIAL PRIMARY KEY,
  flag_key TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  result BOOLEAN NOT NULL,
  reason TEXT,
  rollout_pct INTEGER,
  variant TEXT,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_flag_evaluations_key ON feature_flag_evaluations (flag_key, evaluated_at DESC);