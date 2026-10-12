-- ============================================================
-- Migration 030 - Audit Enhanced
-- ============================================================
-- Extends admin_audit_log with richer metadata.
-- Adds data_access_log for GDPR compliance.

-- Extend admin audit
ALTER TABLE admin_audit_log
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS request_id TEXT,
  ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;

CREATE INDEX idx_admin_audit_category ON admin_audit_log (category, created_at DESC);
CREATE INDEX idx_admin_audit_severity ON admin_audit_log (severity, created_at DESC)
  WHERE severity IN ('warn', 'error', 'critical');

-- Data access log (who accessed whose data)
CREATE TABLE IF NOT EXISTS data_access_log (
  id              BIGSERIAL PRIMARY KEY,
  actor_type      TEXT NOT NULL,     -- admin | user | system | api
  actor_id        UUID,
  subject_id      UUID,              -- whose data was accessed
  resource_type   TEXT NOT NULL,     -- sessions | journal | conversations | exports | profile | ...
  resource_id     UUID,
  action          TEXT NOT NULL,     -- read | write | delete | export | erase
  purpose         TEXT,
  ip_hash         TEXT,
  request_id      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_data_access_actor ON data_access_log (actor_id, created_at DESC);
CREATE INDEX idx_data_access_subject ON data_access_log (subject_id, created_at DESC);
CREATE INDEX idx_data_access_resource ON data_access_log (resource_type, resource_id);

-- Partition by month for scale
-- NOTE: uncomment when data_access_log > 10M rows
-- CREATE TABLE data_access_log_y2026m10 PARTITION OF data_access_log
--   FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');