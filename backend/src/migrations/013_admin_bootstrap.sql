-- Migration 013: Admin M1 Bootstrap + Phase 0 hardening
-- Adds admin identity, audit log, and user origin flag.

-- ═══ Admin users (5 fixed roles) ═══
CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL CHECK (role IN ('owner','ops','science','support','analyst')),
  token_hash    TEXT NOT NULL UNIQUE,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID NULL REFERENCES admin_users(id),
  last_login_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users(status);

-- ═══ Append-only audit log (hash-chained) ═══
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id           BIGSERIAL PRIMARY KEY,
  admin_id     UUID NULL,
  action       TEXT NOT NULL,
  target_type  TEXT NULL,
  target_id    TEXT NULL,
  reason       TEXT NULL,
  ip           TEXT NULL,
  user_agent   TEXT NULL,
  prev_hash    TEXT NOT NULL,
  current_hash TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_admin    ON admin_audit_log(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action   ON admin_audit_log(action, created_at DESC);

-- ═══ users.origin (real|demo|test|internal) ═══
ALTER TABLE users ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'real';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name='users' AND constraint_name='users_origin_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_origin_check
      CHECK (origin IN ('real','demo','test','internal'));
    ALTER TABLE users ADD CONSTRAINT users_status_check
      CHECK (status IN ('active','suspended','deleted'));
  END IF;
END $$;