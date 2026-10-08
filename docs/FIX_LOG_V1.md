# FLASH Backend — Fix Log v1

**Date:** 2026-10-08
**Scope:** Bugs found & fixed during Catalog + Soft Delete + AI Features work
**Status:** v1 (initial) — v2 will follow after catalog migration

---

## Summary

| Category | Count |
|----------|:---:|
| Critical bugs found | 6 |
| Medium bugs found | 7 |
| Minor issues | 4 |
| Pending / Deferred | 5 |
| Migrations added | 2 (010, 011) |
| New services added | 2 (stats.ts, catalog/*) |

---

## 🔴 Critical Bugs

### BUG-001 — `user_game_stats` & `domain_scores` never updated

**Symptom:** Both tables empty after every session. `recommendations.ts` + `planner.ts` reading zero. Snapshot dashboard showing empty stats.

**Root cause:** `derive.ts` computed per-session metrics but no service wrote aggregates into `user_game_stats` or `domain_scores`.

**Fix:**
- Created `services/stats.ts`:
  - `updateUserGameStats(userId, gameId, variant)` — aggregates last 20 sessions
  - `updateDomainScores(userId)` — weighted avg across games in domain
  - `recomputeAllStats(userId)` — full rebuild utility
- Wired into `POST /sessions` **after** badges step (non-fatal try/catch)
- Rebuilt existing data via one-off script

**Files:**
- `services/stats.ts` (new)
- `routes/sessions.ts` (added import + call)

**Migration:** none

**Status:** ✅ Fixed

---

### BUG-002 — `games` table allowed NULL in critical columns

**Symptom:** `rt_ceiling_ms`, `max_score`, `rt_floor_ms` were NULL for some games → catalog migration wrote literal `null` into generated TS files → TypeScript strict mode rejected 32 files.

**Root cause:** Original migration 002 defined these as nullable without defaults.

**Fix:**
- Migration 011:
  - UPDATE NULLs → sane defaults (60000 / 100000 / 100)
  - Add `SET NOT NULL` + `SET DEFAULT`
  - Add CHECK constraint: `rt_ceiling_ms > rt_floor_ms`
- Defensive coding in `_migrate.ts` (fallback defaults if NULL returns)

**Files:**
- `migrations/011_games_defaults.sql` (new)
- `catalog/_migrate.ts` (defensive `numOr()` helper)

**Migration:** 011

**Status:** ✅ Fixed

---

### BUG-003 — Missing indexes on hot query paths

**Symptom:** Every AI feature scans `sessions` table. No index on `(user_id, ended_at)`.

**Fix — Migration 010 adds:**
- `idx_sessions_user_ended` — for all AI features fetching last N sessions
- `idx_sessions_active` — soft-delete-aware queries
- `idx_game_variants_parent_lang` — variants list
- `idx_domain_scores_computed` — stats table
- `idx_user_game_stats_last_played` — stats table
- `idx_games_active` — partial index for soft-deleted games

**Files:** `migrations/010_soft_delete_and_indexes.sql`

**Migration:** 010

**Status:** ✅ Fixed

---

### BUG-004 — `games` table couldn't be safely deleted

**Symptom:** Attempting `DELETE FROM games` was blocked by 5 FKs with `NO ACTION` OR cascaded user data. Deleting a game was dangerous.

**Fix:**
- Added `deleted_at TIMESTAMPTZ` + `deleted_reason TEXT`
- All queries now filter `deleted_at IS NULL`
- Partial index `idx_games_active` for active-only lookups
- Migration 011 ensures NOT NULL on critical fields

**Files:**
- `migrations/010_soft_delete_and_indexes.sql`
- (Query updates to follow in next milestone)

**Migration:** 010

**Status:** ✅ Schema ready — query updates partial

---

### BUG-005 — 32 TypeScript errors due to `noUncheckedIndexedAccess`

**Symptom:** All `arr[0]` accesses were typed `T | undefined` after tsconfig change.

**Files affected:**
| File | Errors |
|------|:---:|
| `services/recommendations.ts` | 14 |
| `services/ai/daily-plan.ts` | 10 |
| `services/ai/fingerprint.ts` | 6 |
| `services/ai/lab.ts` | 1 |
| `services/ai/router.ts` | 1 |

**Fix — pattern applied everywhere:**
```typescript
const row = res.rows[0];
if (!row) return;   // or `?? fallback`
Status: ✅ All fixed

BUG-006 — pg returns DATE column as Date object
Symptom: journal_entries.entry_date returned as 2026-10-07T21:00:00.000Z instead of 2026-10-08.

Root cause: pg driver converts PostgreSQL DATE to JS Date before returning.

Fix: Cast in SQL to text: entry_date::text AS entry_date. Applied to 3 queries in journal.ts.

Files: services/ai/journal.ts

Status: ✅ Fixed

🟡 Medium Bugs
BUG-007 — Groq max_tokens too low for reasoning models
Symptom: gpt-oss-120b returned empty responses with max_tokens: 60 or 120.

Root cause: Reasoning models consume ~300 tokens on internal reasoning before writing the response.

Fix: Minimum max_tokens: 500 for all reasoning-model calls. Bumped to 1400 for JSON-heavy tasks (daily-plan).

Files: Multiple AI services

Status: ✅ Fixed

BUG-008 — allam-2-7b produces generic Arabic output
Symptom: Arabic responses repeated fact-sheet keys verbatim. Missing "no-hype" rules.

Fix:

Added few-shot examples in prompts

Negative examples ("do NOT do this")

Explicit "must reference a concrete number"

Reinforced "single paragraph, no headers"

Files: All prompts-*.ts for Arabic

Status: ✅ Improved

BUG-009 — L4 filter too aggressive for Arabic
Symptom: Arabic word "طبي" triggered L4 violation even in benign context ("this is not medical advice").

Fix: Replaced broad /طبي/ with context-aware patterns:

regex
/(?:تشخيص|علاج|استشارة|حالة|فحص|تقويم)\s+طبي/
Files: services/ai/validator.ts

Status: ✅ Fixed

BUG-010 — OpenRouter free model removed
Symptom: meta-llama/llama-3.3-70b-instruct:free returned 404.

Fix: Switched to google/gemini-2.0-flash-exp:free.

Files: .env

Status: ✅ Fixed

BUG-011 — Gemini API key format changed
Symptom: ?key=AQ.Ab8... returned 401.

Root cause: Google changed key format from AIzaSy... to AQ.Ab8RN6.... New format requires x-goog-api-key header.

Fix: Moved key from URL query to x-goog-api-key header.

Files: services/ai/providers/gemini-provider.ts

Status: ✅ Fixed

BUG-012 — fingerprint cache language collision
Symptom: AR request returned EN content from cache.

Fix: Store language inside traits JSONB; cache check includes cacheLang === language.

Files: services/ai/fingerprint.ts

Status: ✅ Fixed

BUG-013 — daily-plan JSON parse failures
Symptom: gpt-oss-120b truncated JSON → ruleFallback triggered on valid queries.

Fix:

max_tokens: 600 → 1400

json_mode: true

Robust extractJson() with multiple strategies (fence stripping, first-{ to last-})

Files: services/ai/daily-plan.ts

Status: ✅ Fixed

🟢 Minor Issues
BUG-014 — Fastify 415 on POST /ai/lab/abandon without body
Symptom: 415 Unsupported Media Type.

Fix: Changed to DELETE /ai/lab/abandon.

Files: routes/ai-profile.ts

Status: ✅ Fixed

BUG-015 — /ai/lab/current returned non-active experiments
Symptom: Returned last experiment even if completed/abandoned.

Fix: Added AND status = 'active' to WHERE clause.

Files: services/ai/lab.ts

Status: ✅ Fixed

BUG-016 — journal entry_date slice crash
Symptom: String(row.entry_date).slice(0, 10) returned "Thu Oct 08" (not ISO).

Fix: Moved cast into SQL — entry_date::text AS entry_date.

Files: services/ai/journal.ts

Status: ✅ Fixed

BUG-017 — journal.plan_adjusted never set
Symptom: Column stayed false even when adjustment applied.

Fix: Added UPDATE journal_entries SET plan_adjusted = true WHERE id = $1 when adjustment !== 'normal'.

Files: services/ai/journal.ts

Status: ✅ Fixed

📅 Pending / Deferred
ID	Issue	Plan
P1	nudge latency 2.5s (target: 800ms)	Optimize prompt + caching
P2	Auth (Better Auth + Resend)	Sprint 2
P3	Sync (offline-first)	Sprint 3
P4	Dockerfile + Render deploy	Sprint 4
P5	Golden fixture tests	Sprint 4
🔧 Migrations Added
#	File	Purpose
010	010_soft_delete_and_indexes.sql	Soft delete games + 6 hot indexes
011	011_games_defaults.sql	NOT NULL + defaults for rt_ceiling_ms, max_score, rt_floor_ms
📦 Services Added
Service	Purpose
services/stats.ts	user_game_stats + domain_scores maintenance
catalog/types.ts	GameConfig schema
catalog/registry.ts	Game lookup + validation
catalog/_migrate.ts	DB → TS config generator
catalog/_meta.ts	Static metadata (AR names, icons, citations)
🧪 Verification System
Created a universal verifier verify.ps1 at D:\Flash\backend\:

Section 1 — File existence

Section 2 — TypeScript check

Section 3 — Catalog validation

Section 4 — Database connectivity
Run: powershell -ExecutionPolicy Bypass -File verify.ps1

End of Fix Log v1 — Next: Fix Log v2 after catalog migration completes

