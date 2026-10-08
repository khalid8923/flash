-- Migration 014: Player Auth Schema (R03a)
-- Tables only. Logic comes in R03b.
-- Rule: FLASH player id is permanent; auth library id lives in auth_identities.

-- ═══ Auth identities (provider, subject) -> players.id ═══
CREATE TABLE IF NOT EXISTS auth_identities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider     TEXT NOT NULL,     -- 'email_otp' | 'google' | 'passkey'
  subject      TEXT NOT NULL,     -- unique per provider (email, google sub, passkey id)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NULL,
  UNIQUE (provider, subject)
);
CREATE INDEX IF NOT EXISTS idx_auth_id_player ON auth_identities(player_id);

-- ═══ Auth sessions (opaque tokens, hashed) ═══
CREATE TABLE IF NOT EXISTS auth_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash       TEXT NOT NULL UNIQUE,
  device_id        TEXT NULL,
  user_agent       TEXT NULL,
  ip               TEXT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  idle_expires_at  TIMESTAMPTZ NOT NULL,
  abs_expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at       TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_player ON auth_sessions(player_id, revoked_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions(abs_expires_at) WHERE revoked_at IS NULL;

-- ═══ Email OTP codes (short-lived) ═══
CREATE TABLE IF NOT EXISTS auth_otp_codes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL,
  code_hash    TEXT NOT NULL,
  purpose      TEXT NOT NULL DEFAULT 'login',   -- 'login' | 'verify_email'
  attempts     INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL,
  consumed_at  TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS idx_otp_email_purpose ON auth_otp_codes(email, purpose, consumed_at);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON auth_otp_codes(expires_at) WHERE consumed_at IS NULL;