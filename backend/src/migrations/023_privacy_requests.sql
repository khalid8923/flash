-- Migration 023: Privacy requests (R20)
-- Tracks user erasure + export requests.

CREATE TABLE IF NOT EXISTS privacy_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id),
  kind         TEXT NOT NULL CHECK (kind IN ('export','erasure')),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','failed')),
  reason       TEXT NULL,
  result       JSONB NULL,
  error        TEXT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS idx_privacy_req_user ON privacy_requests(user_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_privacy_req_status ON privacy_requests(status, requested_at DESC);