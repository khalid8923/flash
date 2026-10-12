-- ============================================================
-- Migration 029 - User Events
-- ============================================================
-- Append-only event log for analytics, funnel, retention.
-- Replaces metric_daily aggregates with raw facts.

CREATE TABLE user_events (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,     -- signup | login | session_start | session_end | ai_chat | export | delete | ...
  event_data      JSONB NOT NULL DEFAULT '{}'::jsonb,
  session_id      UUID,
  device_id       TEXT,
  ip_hash         TEXT,              -- hashed IP for GDPR
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_events_user_time ON user_events (user_id, created_at DESC);
CREATE INDEX idx_user_events_type_time ON user_events (event_type, created_at DESC);
CREATE INDEX idx_user_events_session ON user_events (session_id) WHERE session_id IS NOT NULL;

-- Time-series aggregation (for dashboard)
CREATE MATERIALIZED VIEW user_events_hourly AS
SELECT
  date_trunc('hour', created_at) AS hour,
  event_type,
  COUNT(*)::bigint AS event_count,
  COUNT(DISTINCT user_id)::bigint AS unique_users
FROM user_events
WHERE created_at > now() - INTERVAL '30 days'
GROUP BY 1, 2;

CREATE UNIQUE INDEX idx_user_events_hourly ON user_events_hourly (hour, event_type);

-- Refresh function (call from cron)
CREATE OR REPLACE FUNCTION refresh_user_events_hourly() RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_events_hourly;
EXCEPTION WHEN OTHERS THEN
  REFRESH MATERIALIZED VIEW user_events_hourly;
END;
$$ LANGUAGE plpgsql;