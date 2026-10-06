# FLASH — Trial Schema v1.0

**Status:** Frozen (Locked for v1)
**Date:** 2026-10-06
**Owner:** All Games (produces trials)
**Consumers:** Shell (collects), Backend (validates + derives)

---

## 1. Purpose

A **Trial** is the atomic unit of "one stimulus-response cycle" inside a Session.

The client's ONLY job is to record what happened. The server's job is to decide
what it means (correctness, RT filtering, scoring).

**Golden rule:** If the server can re-derive it from `seed + trials`, the client
must NOT send it.

---

## 2. Common Shape (All Games)

Every trial has these fields:

```json
{
  "index": 0,
  "rt_ms": 2450,
  "correct": true,
  "is_practice": false,
  "stimulus": { },
  "response": { }
}
```

### 2.1 Common Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `index` | `int` | ✅ | 0-based, strictly increasing, no gaps |
| `rt_ms` | `int \| null` | ✅ | Milliseconds. `null` if no response (timeout) |
| `correct` | `bool \| null` | ✅ | `null` if not applicable (e.g. practice) |
| `is_practice` | `bool` | ✅ | Practice trials excluded from scoring |
| `stimulus` | `object` | ✅ | Game-specific. See §3 |
| `response` | `object` | ✅ | Game-specific. See §3 |

### 2.2 Optional Fields

| Field | Type | When to include |
|---|---|---|
| `phase` | `string` | Multi-phase games (e.g. `"encode"` \| `"recall"`) |
| `meta` | `object` | Game-specific extras (hints used, etc.) |

---

## 3. Game-Specific Schemas

Each game defines its own `stimulus` and `response` shapes.
Full definitions in `04_GAME_CATALOG.md`. Below are the patterns by category.

### 3.1 Multiple-Choice Games

**Pattern:** Stimulus shows something, user picks from options.

```json
{
  "stimulus": {
    "prompt": "hot → cold :: day → ?",
    "options": ["night", "morning", "sun", "star"]
  },
  "response": {
    "selected_index": 0
  },
  "rt_ms": 1820,
  "correct": true
}
```

**Games using this:**
- `vocabulary-elite` — Word → synonym
- `verbal-analogies` — A→B :: C→?
- `syllogisms` — Pick valid conclusion
- `matrix-logic` — Pick missing tile
- `deduction` — Pick correct inference
- `argument-analyzer` — Pick fallacy type
- `tone-detector` — Pick emotional tone
- `social-read` — Pick correct interpretation

---

### 3.2 Digit/Sequence Recall

**Pattern:** Sequence shown one-by-one, user enters it back.

```json
{
  "stimulus": {
    "digits": [3, 7, 5, 2],
    "show_ms": 950,
    "gap_ms": 280
  },
  "response": {
    "entered": [3, 7, 5, 2],
    "entry_duration_ms": 3400
  },
  "rt_ms": 3400,
  "correct": true
}
```

**Games using this:**
- `seq-mem` — Forward digit span
- `digit-span` — Reverse digit span (uses `direction: "reverse"`)

---

### 3.3 Spatial Click Games

**Pattern:** Grid/map shown, user clicks positions in order.

```json
{
  "stimulus": {
    "grid": { "rows": 4, "cols": 4 },
    "target_cells": [0, 5, 10, 15],
    "flash_ms": 600
  },
  "response": {
    "clicked_cells": [0, 5, 10, 15],
    "click_times_ms": [420, 380, 510, 340]
  },
  "rt_ms": 1650,
  "correct": true
}
```

**Games using this:**
- `corsi-blocks` — Block recall
- `pattern-recall` — Grid pattern
- `map-memory` — Landmark positions

---

### 3.4 Reaction Time Games

**Pattern:** Wait for signal, respond fast. Correctness is binary.

```json
{
  "stimulus": {
    "signal": "green",
    "delay_ms": 2400
  },
  "response": {
    "action": "space",
    "too_early": false
  },
  "rt_ms": 187,
  "correct": true
}
```

**Games using this:**
- `reaction` — Simple RT
- `vigilance` — Sustained attention (CPT-X)
- `color-match` — Stroop (also uses options)
- `symbol-sprint` — Visual search

**Anti-cheat note:** Server rejects `rt_ms < 100` for these games.

---

### 3.5 Go/No-Go Games

**Pattern:** Two stimulus types. One → press, other → withhold.

```json
{
  "stimulus": {
    "type": "go",
    "shape": "circle",
    "color": "blue"
  },
  "response": {
    "pressed": true,
    "pressed_at_ms": 340
  },
  "rt_ms": 340,
  "correct": true
}
```

**On No-Go stimulus:**
```json
{
  "stimulus": { "type": "no-go", "shape": "square", "color": "red" },
  "response": { "pressed": false, "pressed_at_ms": null },
  "rt_ms": null,
  "correct": true
}
```

**Games using this:**
- `go-no-go` — Classic paradigm

---

### 3.6 Task-Switching Games

**Pattern:** Rules change. Trial records which rule was active.

```json
{
  "stimulus": {
    "card": { "color": "red", "shape": "circle" },
    "active_rule": "color",
    "is_switch": true,
    "previous_rule": "shape"
  },
  "response": {
    "selected_index": 0
  },
  "rt_ms": 720,
  "correct": true
}
```

**Games using this:**
- `task-switching` — Rule switching
- `rapid-fire` — Multi-rule rapid switching

---

### 3.7 Free-Response / Creativity Games

**Pattern:** User types/types text or picks from word bank.

```json
{
  "stimulus": {
    "prompt": "List uses for a brick",
    "time_limit_ms": 30000
  },
  "response": {
    "entries": ["build wall", "paperweight", "doorstop"],
    "entry_times_ms": [3200, 7400, 12800]
  },
  "rt_ms": 12800,
  "correct": null
}
```

**Note:** `correct` is `null` — server scores novelty/fluency separately.

**Games using this:**
- `alternative-uses` — List uses
- `idea-flow` — Category-based generation
- `story-spark` — Story opening
- `creative-connect` — Remote associates (uses options actually)

---

### 3.8 Puzzle / Constraint Games

**Pattern:** Each move = one trial. Session ends when puzzle solved (or failed).

```json
{
  "index": 0,
  "stimulus": {
    "state_before": { "rod_a": [3, 2, 1], "rod_b": [], "rod_c": [] },
    "legal_moves": [
      { "from": "rod_a", "to": "rod_b" },
      { "from": "rod_a", "to": "rod_c" }
    ]
  },
  "response": {
    "move": { "from": "rod_a", "to": "rod_c" }
  },
  "rt_ms": 4200,
  "correct": true
}
```

**Games using this:**
- `hanoi` — Tower of Hanoi
- `river-crossing` — Constraint satisfaction
- `path-finder` — Maze navigation
- `gear-logic` — Parity reasoning (may be move-based or choice-based)
- `mental-rotation` — Uses choice pattern actually
- `block-counter` — Uses choice pattern

---

### 3.9 Memory-Match Games

**Pattern:** Encode phase → delay → recall phase.

```json
{
  "phase": "encode",
  "stimulus": { "faces": ["f1", "f2", "f3"], "names": ["Alice", "Bob", "Carol"] },
  "response": { "action": "acknowledged" },
  "rt_ms": 3200,
  "correct": null
}
```
Then:
```json
{
  "phase": "recall",
  "stimulus": { "target_face": "f2", "options": ["Alice", "Bob", "Carol", "Dan"] },
  "response": { "selected_index": 1 },
  "rt_ms": 2400,
  "correct": true
}
```

**Games using this:**
- `face-match` — Face-name pairs
- `n-back` — Continuous (see below)
- `flash-cards` — Flashcard recall

**N-Back variant:**
```json
{
  "stimulus": { "letter": "K", "n": 2, "position_in_seq": 5 },
  "response": { "is_match": false },
  "rt_ms": 480,
  "correct": true
}
```

---

## 4. Validation Rules (Server-Side)

Before accepting a trial, the server checks:

| # | Rule | Rejection Reason |
|---|---|---|
| 1 | `index` is `int ≥ 0` | `"bad_index"` |
| 2 | `index` values are unique + sequential | `"index_gap"` |
| 3 | `rt_ms` is `int ≥ 0` OR `null` | `"bad_rt"` |
| 4 | `correct` is `bool` OR `null` | `"bad_correct"` |
| 5 | `is_practice` is `bool` | `"bad_practice"` |
| 6 | `stimulus` matches game's schema | `"bad_stimulus"` |
| 7 | `response` matches game's schema | `"bad_response"` |
| 8 | If `rt_ms` is not null and `game.rt_floor_ms` exists → `rt_ms ≥ rt_floor_ms` | `"rt_too_fast"` |
| 9 | If `rt_ms` is not null and `game.rt_ceiling_ms` exists → `rt_ms ≤ rt_ceiling_ms` | `"rt_too_slow"` |

**RT floor defaults** (per game, from catalog):
- Choice tasks: `150 ms`
- Simple RT: `100 ms`
- Text entry: `500 ms`

---

## 5. What the Server Derives (Never Send These)

The client MUST NOT send any of these — the server computes them:

| Derived Field | Formula |
|---|---|
| `valid_trials` | `trials.filter(t => !t.is_practice && t.rt_ms !== null)` |
| `accuracy` | `valid_trials.filter(correct).length / valid_trials.length * 100` |
| `median_rt_ms` | Median of `rt_ms` across correct valid trials |
| `rtv` | Std dev of `rt_ms` across correct valid trials |
| `rcs` | `correct_count / (total_rt_seconds)` |
| `max_level` | Highest `stimulus.difficulty_level` in the session |
| `primary_score` | Game-specific formula (defined in catalog) |

**If a client sends any of these, server IGNORES them.** This is critical — we
never trust client-supplied aggregates.

---

## 6. Practice Trials

- Mark with `"is_practice": true`.
- Excluded from: accuracy, medianRT, RCS, PBs, badges, profile.
- Still stored in `session_trials` (for audit + replays).
- Typical count: 1–3 per session, at the start.
- Game can skip practice on subsequent sessions (client decides) —
  but if included, must be marked correctly.

---

## 7. Timeouts

When a user doesn't respond before the time limit:
- `response` reflects "no action" (e.g. `{ "action": null }` or `{ "selected_index": null }`)
- `rt_ms = null`
- `correct = false`

**Exception:** Some games treat timeout as a specific "timeout" response:
```json
"response": { "timed_out": true }
```

Server treats both patterns equivalently.

---

## 8. Anti-Cheat Signals (Optional)

Games MAY include additional signals in `meta` for anti-cheat:

```json
{
  "meta": {
    "mouse_moves_during_trial": 42,
    "keystrokes_during_trial": 3,
    "tab_visible": true,
    "focus_events": 0
  }
}
```

The server uses these to compute `anomaly_score` but never surfaces them.
Games with high-fidelity anti-cheat (flanker, go-no-go) may include more.

---

## 9. Example — Complete Trial Set (seq-mem, Classic)

```json
"trials": [
  {
    "index": 0,
    "stimulus": { "digits": [3, 7, 5], "show_ms": 950, "gap_ms": 280 },
    "response": { "entered": [3, 7, 5], "entry_duration_ms": 2450 },
    "rt_ms": 2450,
    "correct": true,
    "is_practice": false
  },
  {
    "index": 1,
    "stimulus": { "digits": [8, 2, 1, 9], "show_ms": 950, "gap_ms": 280 },
    "response": { "entered": [8, 2, 1, 9], "entry_duration_ms": 3120 },
    "rt_ms": 3120,
    "correct": true,
    "is_practice": false
  },
  {
    "index": 2,
    "stimulus": { "digits": [4, 6, 1, 8, 3], "show_ms": 950, "gap_ms": 280 },
    "response": { "entered": [4, 6, 1, 3, 8], "entry_duration_ms": 4280 },
    "rt_ms": 4280,
    "correct": false,
    "is_practice": false
  }
]
```

---

## 10. Versioning

- Trial schema uses the **session's `schema_version`** — no separate version.
- Adding optional fields → same version.
- Changing required fields → bump session schema to v2.

---

## 11. Size Budget

**Per trial:** ~200–500 bytes JSON (typical).
**Per session:** ~10–25 KB JSON (typical, 30–50 trials).
**Compression:** Sessions stored server-side use gzip. Client uploads uncompressed.

---

## END OF TRIAL SCHEMA v1.0