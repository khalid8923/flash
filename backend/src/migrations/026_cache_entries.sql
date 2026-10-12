-- ============================================================
-- Migration 026 - Cache Entries
-- ============================================================
-- Durable cache for AI responses, game catalogs, computed aggregates.
-- Can be queried before falling back to LLM or expensive computations.
--
-- NOTE: Uses composite index (scope, expires_at) instead of partial
--       with now() because PostgreSQL requires IMMUTABLE predicates.

CREATE TABLE cache_entries (
  key             TEXT PRIMARY KEY,
  value           JSONB NOT NULL,
  scope           TEXT NOT NULL DEFAULT 'global',
  provider        TEXT,
  hits            INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ
);

CREATE INDEX idx_cache_entries_scope_expires
  ON cache_entries (scope, expires_at);

CREATE INDEX idx_cache_entries_expires
  ON cache_entries (expires_at)
  WHERE expires_at IS NOT NULL;

CREATE OR REPLACE FUNCTION cache_hit(p_key TEXT) RETURNS VOID AS $$
BEGIN
  UPDATE cache_entries
     SET hits = hits + 1,
         last_used_at = now()
   WHERE key = p_key;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_expired_cache() RETURNS INTEGER AS $$
DECLARE n INTEGER;
BEGIN
  DELETE FROM cache_entries
   WHERE expires_at IS NOT NULL AND expires_at < now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$ LANGUAGE plpgsql;