-- ============================================================
-- Migration 025 - Idempotency Keys
-- ============================================================
-- Durable idempotency across restarts and instances.
-- Replaces in-memory Map for POST /sessions and other mutations.

CREATE TABLE idempotency_keys (
  key             TEXT PRIMARY KEY,
  response        JSONB NOT NULL,
  status          INTEGER NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_idempotency_expires ON idempotency_keys (expires_at);

-- Cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency() RETURNS INTEGER AS $$
DECLARE n INTEGER;
BEGIN
  DELETE FROM idempotency_keys WHERE expires_at < now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$ LANGUAGE plpgsql;