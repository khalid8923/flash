-- Migration 022: Job runs (M7-01)
-- DB-backed job queue. Single worker for now.

CREATE TABLE IF NOT EXISTS job_runs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','done','failed')),
  payload      JSONB NULL,
  result       JSONB NULL,
  error        TEXT NULL,
  attempts     INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  run_after    TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at   TIMESTAMPTZ NULL,
  finished_at  TIMESTAMPTZ NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_job_runs_pending  ON job_runs(run_after) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_job_runs_kind     ON job_runs(kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_runs_status   ON job_runs(status, created_at DESC);