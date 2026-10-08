-- Migration 021: AI provider usage ledger (R16)
-- Logs every AI call: provider, model, tokens, cost, latency.

CREATE TABLE IF NOT EXISTS ai_provider_usage (
  id            BIGSERIAL PRIMARY KEY,
  feature       TEXT NOT NULL,
  provider      TEXT NOT NULL,
  model         TEXT NOT NULL,
  language      TEXT,
  user_id       UUID NULL,
  tokens_prompt INT DEFAULT 0,
  tokens_completion INT DEFAULT 0,
  tokens_total  INT DEFAULT 0,
  cost_usd      NUMERIC(10,6) DEFAULT 0,
  latency_ms    INT DEFAULT 0,
  outcome       TEXT NOT NULL DEFAULT 'ok',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_usage_day     ON ai_provider_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_feature ON ai_provider_usage(feature, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_user    ON ai_provider_usage(user_id, created_at DESC);