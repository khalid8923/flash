-- ============================================================
-- Migration 027 - Job Queue Enhanced
-- ============================================================
-- Adds priority, unique key, and worker tracking.
-- Extends existing job_runs table (migration 022).

ALTER TABLE job_runs
  ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_key TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS worker_id TEXT,
  ADD COLUMN IF NOT EXISTS heartbeat_at TIMESTAMPTZ;

-- Unique job by key (prevents duplicate enqueues)
CREATE UNIQUE INDEX idx_job_runs_unique_key
  ON job_runs (unique_key)
  WHERE unique_key IS NOT NULL AND status IN ('pending', 'running');

-- Efficient claim query
CREATE INDEX idx_job_runs_claim
  ON job_runs (status, scheduled_at, priority DESC)
  WHERE status = 'pending';

-- Stale job recovery (running but no heartbeat)
CREATE INDEX idx_job_runs_stale
  ON job_runs (heartbeat_at)
  WHERE status = 'running';

-- Reclaim stale jobs (> 5 min without heartbeat)
CREATE OR REPLACE FUNCTION reclaim_stale_jobs() RETURNS INTEGER AS $$
DECLARE n INTEGER;
BEGIN
  UPDATE job_runs
     SET status = 'pending',
         worker_id = NULL,
         started_at = NULL
   WHERE status = 'running'
     AND heartbeat_at < now() - INTERVAL '5 minutes';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$ LANGUAGE plpgsql;