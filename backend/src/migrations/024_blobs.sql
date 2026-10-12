-- ============================================================
-- Migration 024 - Blobs (Storage Layer)
-- ============================================================
-- For exports, backups, voice recordings, generated files.
-- Replaces S3 for free tier. Migrate to S3 when > 500MB.

CREATE TABLE blobs (
  key             TEXT PRIMARY KEY,
  data            BYTEA NOT NULL,
  content_type    TEXT NOT NULL DEFAULT 'application/octet-stream',
  size            INTEGER NOT NULL,
  public          BOOLEAN NOT NULL DEFAULT false,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_blobs_prefix ON blobs (key text_pattern_ops) WHERE deleted_at IS NULL;
CREATE INDEX idx_blobs_expires ON blobs (expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_blobs_public ON blobs (public) WHERE public = true AND deleted_at IS NULL;

-- Auto-cleanup of expired blobs
CREATE OR REPLACE FUNCTION cleanup_expired_blobs() RETURNS INTEGER AS $$
DECLARE n INTEGER;
BEGIN
  DELETE FROM blobs WHERE expires_at IS NOT NULL AND expires_at < now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$ LANGUAGE plpgsql;