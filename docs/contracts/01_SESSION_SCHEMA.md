# FLASH — Session Schema v1.0

**Status:** Frozen (Locked for v1)
**Date:** 2026-10-06
**Owner:** Shell + Backend
**Consumers:** All 36 games (indirectly via Shell), Backend API, Sync Layer

---

## 1. Purpose

A **Session** is the atomic unit of "one play of one game from start to end."
It is an **immutable fact**: once created, it never changes. Corrections happen
by creating a new session with `supersedes_id` (not v1).

This is the single source of truth for:
- Accuracy, medianRT, RCS (server-derived)
- Personal Bests (server-derived)
- Badges (server-derived)
- Cognitive Profile (server-derived)
- Sync / Merge (Set Union on `client_session_id`)

---

## 2. Shape

```json
{
  "schema_version": 1,

  "client_session_id": "0192a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b",
  "game_id": "seq-mem",
  "domain_id": "memory",
  "mode": "classic",

  "seed": "a1b2c3d4e5f60718",
  "ticket_id": null,

  "started_at": "2026-10-06T14:32:11.000Z",
  "ended_at":   "2026-10-06T14:33:42.500Z",

  "game_version": "1.0.0",
  "scoring_version": 1,

  "trials": [
    {
      "index": 0,
      "stimulus": { "digits": [3, 7, 5] },
      "response": { "entered": [3, 7, 5] },
      "rt_ms": 2450,
      "correct": true,
      "is_practice": false
    }
  ],

  "config": {
    "max_lives": 3,
    "max_level": 15,
    "difficulty_level": 1
  },

  "client_meta": {
    "user_agent": "Mozilla/5.0 ...",
    "viewport": { "w": 1920, "h": 1080 },
    "device_id": "device-uuidv7-here",
    "device_clock_skew_ms": null
  },

  "source": "live"
}
```

---

## 3. Field Definitions

### 3.1 Identity (required)

| Field | Type | Notes |
|---|---|---|
| `schema_version` | `int` | **Always `1` for v1.** Server rejects unknown versions |
| `client_session_id` | `string (UUIDv7)` | **Client-generated.** Unique key for dedup. Never reuse |
| `game_id` | `string (slug)` | Must match a catalog entry (e.g. `seq-mem`) |
| `domain_id` | `string (slug)` | Denormalized for indexing (e.g. `memory`) |
| `mode` | `enum` | One of: `classic`, `speed`, `endless`, `precision`, `daily` |

### 3.2 Determinism (required)

| Field | Type | Notes |
|---|---|---|
| `seed` | `string (hex, ≥16 chars)` | Drives ALL random stimuli. Server re-derives to verify |
| `ticket_id` | `string \| null` | `null` for offline/legacy. Set for verified online play |

### 3.3 Timing (required)

| Field | Type | Notes |
|---|---|---|
| `started_at` | `ISO 8601 UTC` | Client clock. Server may reject future/implausible |
| `ended_at` | `ISO 8601 UTC` | Must be ≥ `started_at`. Max duration: **60 min** |

### 3.4 Versioning (required)

| Field | Type | Notes |
|---|---|---|
| `game_version` | `semver string` | e.g. `"1.0.0"`. Bumped when game logic changes |
| `scoring_version` | `int` | Which scoring formula produced derived metrics. Server-owned |

### 3.5 Data Payload (required)

| Field | Type | Notes |
|---|---|---|
| `trials` | `array<Trial>` | **Raw trials only.** See TRIAL_SCHEMA. Server computes all aggregates |
| `config` | `object` | Snapshot of session config (lives, level, etc.) |

### 3.6 Client Metadata (required)

| Field | Type | Notes |
|---|---|---|
| `client_meta.user_agent` | `string` | For debugging + anti-cheat signals |
| `client_meta.viewport` | `{w, h}` | For anti-cheat (e.g. headless detection) |
| `client_meta.device_id` | `string (UUIDv7)` | Stable per install |
| `client_meta.device_clock_skew_ms` | `int \| null` | Set after first sync |

### 3.7 Provenance (required)

| Field | Type | Notes |
|---|---|---|
| `source` | `enum` | `live` \| `offline` \| `legacy_import` |

---

## 4. Modes — Detailed

### 4.1 `classic`
- **Purpose:** Standard progression from Level 1 → Level 15
- **Trials:** 3 per level → 45 max
- **Lives:** 3
- **On error:** Lose 1 life. At 0 lives → session ends

### 4.2 `speed`
- **Purpose:** Fast answers, no life-loss
- **Trials:** 20
- **Time limit:** Per-trial (game-specific, typically 1.5s–3s)
- **On error:** No life lost. Counts against accuracy

### 4.3 `endless`
- **Purpose:** One mistake = game over
- **Trials:** Unlimited (until first error)
- **Difficulty:** Ramps up each correct trial
- **On error:** Immediate session end

### 4.4 `precision`
- **Purpose:** Max accuracy, no time pressure
- **Trials:** 15
- **Time limit:** None
- **On error:** Counts against accuracy but doesn't end session

### 4.5 `daily`
- **Purpose:** Once-per-day fixed protocol
- **Trials:** 20–30 (game-specific)
- **Time limit:** Fixed per-trial
- **Locking:** Server rejects if `mode: "daily"` and user already completed one today (unless `source: "legacy_import"`)

---

## 5. Validation Rules (Server-Side)

The server **must** run these before accepting:

| # | Rule | Action |
|---|---|---|
| 1 | `schema_version === 1` | Reject with `"update_required"` |
| 2 | `client_session_id` is valid UUIDv7 | Reject with `"malformed"` |
| 3 | `game_id` exists in catalog | Reject with `"unknown_game"` |
| 4 | `mode` is one of the 5 allowed | Reject with `"invalid_mode"` |
| 5 | `started_at < ended_at` AND `ended_at ≤ now + 5min` | Reject |
| 6 | `ended_at - started_at ≤ 60 min` | Reject with `"too_long"` |
| 7 | `trials.length ≥ 1` | Reject with `"empty"` |
| 8 | Every trial passes TRIAL_SCHEMA validation | Reject with `"bad_trial"` |
| 9 | `seed` matches ticket if `ticket_id` present | Reject with `"seed_mismatch"` |

**On rejection:** Log integrity event, return generic error (never reveal which rule).

---

## 6. Idempotency Contract

- The unique key is `(user_id, client_session_id)`.
- Re-sending the same session **must be a no-op**.
- Response for duplicate: `{ status: "already_accepted", server_session_id: "..." }`

This makes retries safe and enables Union-based merge.

---

## 7. Example — Classic Session (Complete)

```json
{
  "schema_version": 1,
  "client_session_id": "0192a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b",
  "game_id": "seq-mem",
  "domain_id": "memory",
  "mode": "classic",
  "seed": "f8e7d6c5b4a3928170a1b2c3d4e5f607",
  "ticket_id": "tkt_01HZ...",
  "started_at": "2026-10-06T14:32:11.000Z",
  "ended_at": "2026-10-06T14:33:42.500Z",
  "game_version": "1.0.0",
  "scoring_version": 1,
  "trials": [
    { "index": 0, "stimulus": {"digits":[3,7,5]}, "response": {"entered":[3,7,5]}, "rt_ms": 2450, "correct": true, "is_practice": false },
    { "index": 1, "stimulus": {"digits":[8,2,1,9]}, "response": {"entered":[8,2,1,9]}, "rt_ms": 3120, "correct": true, "is_practice": false }
  ],
  "config": { "max_lives": 3, "max_level": 15, "difficulty_level": 1 },
  "client_meta": {
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "viewport": { "w": 1920, "h": 1080 },
    "device_id": "0192a3b4-0000-7000-8000-000000000001",
    "device_clock_skew_ms": 42
  },
  "source": "live"
}
```

---

## 8. Versioning Policy

- `schema_version` bumps ONLY on breaking changes.
- Adding optional fields → same version.
- Removing/renaming fields → new version.
- Server accepts `[current, current - 1]`. Older → `"update_required"`.

---

## 9. What Server Derives (Never Send)

Clients **must NOT** send these (server computes them):
- `accuracy`
- `median_rt_ms`
- `rcs`
- `score`
- `max_level_reached`
- `pb_flag`
- `badges_unlocked`

If a client sends them, server ignores them silently.

---

## 10. Open Questions (Resolved for v1)

| Q | Decision |
|---|---|
| Per-trial or per-session aggregation? | **Per-trial.** Server derives all |
| What about games without lives? | `config.max_lives = null` is allowed |
| What about games with no per-trial correctness? | `trial.correct = null` allowed; game-specific schema in catalog |
| What about puzzle games (Hanoi, River Crossing)? | Each "move" is a trial. Server derives optimal-move ratio |

---

## END OF SESSION SCHEMA v1.0