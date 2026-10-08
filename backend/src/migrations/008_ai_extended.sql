-- ═══════════════════════════════════════════════════════════
-- Migration 008 — AI Extended Features
-- Adds: nudge cache, journal entries, fingerprints,
--       predictions, variants, error patterns, lessons
-- ═══════════════════════════════════════════════════════════

-- ─── In-Game Micro-Coach (#1) ───
CREATE TABLE IF NOT EXISTS nudge_cache (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_hash  TEXT NOT NULL,
  trigger_type  TEXT NOT NULL, -- slow_down | speed_up | tired | focus | streak_break
  language      TEXT NOT NULL CHECK (language IN ('en','ar')),
  message       TEXT NOT NULL,
  used_count    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pattern_hash, language)
);

CREATE INDEX IF NOT EXISTS idx_nudge_cache_pattern
  ON nudge_cache (pattern_hash, language, used_count);

-- ─── Cognitive Fingerprint (#2) ───
CREATE TABLE IF NOT EXISTS cognitive_fingerprints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  archetype       TEXT NOT NULL,
  summary         TEXT NOT NULL,
  traits          JSONB NOT NULL,
  confidence      REAL NOT NULL,
  sessions_used   INT NOT NULL,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fingerprints_user
  ON cognitive_fingerprints (user_id, generated_at DESC);

-- ─── Dynamic Game Variants (#3) ───
CREATE TABLE IF NOT EXISTS game_variants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_game_id  TEXT NOT NULL REFERENCES games(id),
  variant_id      TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  rules           JSONB NOT NULL,
  difficulty_mod  REAL NOT NULL DEFAULT 1.0,
  language        TEXT NOT NULL CHECK (language IN ('en','ar')),
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (parent_game_id, variant_id, language)
);

-- ─── Predictive Coach (#4) ───
CREATE TABLE IF NOT EXISTS predictions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id         TEXT NOT NULL REFERENCES games(id),
  current_level   INT NOT NULL,
  predicted_level INT NOT NULL,
  sessions_eta    INT NOT NULL,
  confidence      REAL NOT NULL,
  reasoning       TEXT NOT NULL,
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_predictions_user
  ON predictions (user_id, computed_at DESC);

-- ─── AI Journal (#5) ───
CREATE TABLE IF NOT EXISTS journal_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_date      DATE NOT NULL,
  mood            TEXT NOT NULL,
  energy          INT NOT NULL CHECK (energy BETWEEN 1 AND 5),
  note            TEXT,
  plan_adjusted   BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, entry_date)
);

-- ─── AI Lab (#7) ───
CREATE TABLE IF NOT EXISTS lab_experiments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  experiment_key  TEXT NOT NULL,
  title           TEXT NOT NULL,
  hypothesis      TEXT NOT NULL,
  protocol        JSONB NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('active','completed','abandoned')),
  baseline_metric REAL,
  result_metric   REAL,
  result_summary  TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_lab_user_status
  ON lab_experiments (user_id, status);

-- ─── Micro-Lessons (#10) ───
CREATE TABLE IF NOT EXISTS micro_lessons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic           TEXT NOT NULL,
  language        TEXT NOT NULL CHECK (language IN ('en','ar')),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  citation        TEXT NOT NULL,
  related_games   JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (topic, language)
);

-- ─── Director Sessions (#8) ───
CREATE TABLE IF NOT EXISTS director_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  script          JSONB NOT NULL,
  checkpoints     JSONB NOT NULL DEFAULT '[]'::jsonb,
  final_state     TEXT
);

-- ─── Voice logs (#6) ───
CREATE TABLE IF NOT EXISTS voice_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  duration_ms     INT NOT NULL,
  transcript      TEXT NOT NULL,
  reply           TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Transfer Tracker (#12) ───
CREATE TABLE IF NOT EXISTS transfer_signals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_domain   TEXT NOT NULL,
  target_domain   TEXT NOT NULL,
  correlation     REAL NOT NULL,
  confidence      REAL NOT NULL,
  evidence_count  INT NOT NULL,
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, source_domain, target_domain)
);

-- ─── Error Patterns (#11) ───
CREATE TABLE IF NOT EXISTS error_patterns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id         TEXT NOT NULL REFERENCES games(id),
  pattern_key     TEXT NOT NULL,
  description     TEXT NOT NULL,
  frequency       INT NOT NULL,
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, game_id, pattern_key)
);