-- Migration 019: Metric daily rollups (M8-02)
-- Nightly-aggregated, real origin only.

CREATE TABLE IF NOT EXISTS metric_daily (
  day         DATE NOT NULL,
  metric      TEXT NOT NULL,
  origin      TEXT NOT NULL DEFAULT 'real',
  value       NUMERIC NOT NULL,
  breakdown   JSONB NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (day, metric, origin)
);
CREATE INDEX IF NOT EXISTS idx_metric_daily_metric ON metric_daily(metric, day DESC);