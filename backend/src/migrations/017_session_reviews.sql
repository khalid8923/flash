-- Migration 017: Session reviews (M4-02)
-- Annotations on sessions: accept / quarantine / invalidate.
-- Facts are NEVER edited. Reviews are append-only sidecars.

CREATE TABLE IF NOT EXISTS session_reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES sessions(id),
  reviewer_id   UUID NULL REFERENCES admin_users(id),
  verdict       TEXT NOT NULL CHECK (verdict IN ('accept','quarantine','invalidate')),
  reason        TEXT NOT NULL,
  notes         TEXT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_session_reviews_session ON session_reviews(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_reviews_verdict ON session_reviews(verdict, created_at DESC);