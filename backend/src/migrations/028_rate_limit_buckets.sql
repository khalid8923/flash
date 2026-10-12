-- ============================================================
-- Migration 028 - Rate Limit Buckets
-- ============================================================
-- Durable rate limiting for multi-instance deployments.
-- Replaces @fastify/rate-limit in-memory store for scale.

CREATE TABLE rate_limit_buckets (
  key             TEXT PRIMARY KEY,   -- e.g. "ip:1.2.3.4" or "user:uuid"
  scope           TEXT NOT NULL,      -- public | auth | ai | admin | voice
  count           INTEGER NOT NULL DEFAULT 0,
  window_start    TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_seconds  INTEGER NOT NULL,
  limit_value     INTEGER NOT NULL,
  blocked_until   TIMESTAMPTZ
);

CREATE INDEX idx_rate_limit_window ON rate_limit_buckets (window_start) WHERE blocked_until IS NULL;
CREATE INDEX idx_rate_limit_blocked ON rate_limit_buckets (blocked_until) WHERE blocked_until IS NOT NULL;

-- Atomic increment (used by middleware)
CREATE OR REPLACE FUNCTION rate_limit_check(
  p_key TEXT,
  p_scope TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
) RETURNS TABLE (allowed BOOLEAN, current_count INTEGER, reset_at TIMESTAMPTZ) AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  INSERT INTO rate_limit_buckets (key, scope, count, window_start, window_seconds, limit_value)
  VALUES (p_key, p_scope, 1, v_now, p_window_seconds, p_limit)
  ON CONFLICT (key) DO UPDATE SET
    count = CASE
      WHEN rate_limit_buckets.window_start < v_now - (p_window_seconds || ' seconds')::interval
      THEN 1
      ELSE rate_limit_buckets.count + 1
    END,
    window_start = CASE
      WHEN rate_limit_buckets.window_start < v_now - (p_window_seconds || ' seconds')::interval
      THEN v_now
      ELSE rate_limit_buckets.window_start
    END,
    scope = p_scope,
    window_seconds = p_window_seconds,
    limit_value = p_limit
  RETURNING count, window_start INTO v_count, v_window_start;

  RETURN QUERY SELECT
    (v_count <= p_limit) AS allowed,
    v_count AS current_count,
    (v_window_start + (p_window_seconds || ' seconds')::interval) AS reset_at;
END;
$$ LANGUAGE plpgsql;

-- Cleanup old buckets
CREATE OR REPLACE FUNCTION cleanup_rate_limit_buckets() RETURNS INTEGER AS $$
DECLARE n INTEGER;
BEGIN
  DELETE FROM rate_limit_buckets
   WHERE window_start < now() - INTERVAL '1 hour';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$ LANGUAGE plpgsql;