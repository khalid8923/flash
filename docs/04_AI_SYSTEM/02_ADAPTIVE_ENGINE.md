$code = @'
# FLASH — AI & Adaptive Engine (Implementation Log)

**Date:** 2026-10-07
**Status:** ✅ Implemented
**Duration:** 1 session

---

## 📊 Summary

In this session, we implemented the **AI Layer** and **Adaptive Difficulty Engine** end-to-end. All 36 games now have:
- AI content generation (unlimited, unique per play)
- Adaptive difficulty (15 calibrated levels each)

**Total new code:** ~2500 lines across 12 files
**Total DB rows added:** 540 difficulty levels + AI prompt templates

---

## 🎯 PART 1: AI Content Generation

### 1.1 Overview

Every game can now generate **fresh, unlimited content** using Groq LLM.
Content is cached in DB. Supports EN + AR.

### 1.2 Architecture
User Request
↓
POST /ai/generate { game_id, difficulty, language }
↓
┌─────────────────────────────────────┐
│ 1. Check cache (generated_content_cache)
│ → if hit: return cached, used_count++
│ 2. If miss: call Groq LLM
│ 3. Validate JSON response
│ 4. Store in cache
│ 5. Return content
└─────────────────────────────────────┘
↓
{ content, source: 'cache'|'groq', latency_ms, tokens }

text

### 1.3 Groq Integration

- **Provider:** GroqCloud
- **Model:** `openai/gpt-oss-120b`
- **Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
- **Mode:** JSON mode (structured output)
- **Max tokens:** 1500
- **Temperature:** 0.85
- **Timeout:** 30s

**Config:**
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b

text

### 1.4 Prompt Templates — All 36 Games

Every game has a **custom prompt template** that teaches the LLM the paradigm.

**Base Prompts (7):**
1. `verbal-analogies` — Sternberg 1977
2. `vocabulary-elite` — WAIS-IV
3. `syllogisms` — Aristotle
4. `argument-analyzer` — Abrami 2015
5. `matrix-logic` — Raven 1938
6. `story-spark` — Amabile 1982
7. `alternative-uses` — Guilford 1967

**Batch 1 (10):**
8. `deduction` — Evans 2008
9. `word-scramble` — lexical access
10. `lexical-decision` — Meyer 1971
11. `creative-connect` — Mednick 1962
12. `idea-flow` — Guilford
13. `tone-detector` — MSCEIT
14. `micro-expressions` — Ekman 1969
15. `empathy-engine` — Ickes 1993
16. `social-read` — Burgoon 1994
17. `go-no-go` — Drewe 1975

**Batch 2 (12):**
18. `vigilance` — Rosvold 1956
19. `task-switching` — Monsell 2003
20. `color-match` — Stroop 1935
21. `symbol-sprint` — Treisman 1980
22. `rapid-fire` — Monsell 2003
23. `flanker` — Eriksen 1974
24. `reaction` — simple RT
25. `corsi-blocks` — Corsi 1972
26. `map-memory` — Postma 1996
27. `block-counter` — KABC
28. `mental-rotation` — Shepard 1971
29. `pattern-recall` — Corsi 1972

**Batch 3 (7):**
30. `n-back` — Jaeggi 2008
31. `seq-mem` — Miller 1956
32. `face-match` — Naveh-Benjamin 2000
33. `hanoi` — Simon 1975
34. `river-crossing` — Simon 1971
35. `gear-logic` — Hegarty 2004
36. `path-finder` — Shallice 1982

### 1.5 Example — Generated Content

**Request:**
```json
POST /ai/generate
{ "game_id": "verbal-analogies", "difficulty": 5, "language": "en" }
Response:

json
{
  "content": {
    "a": "bird",
    "b": "wing",
    "c": "fish",
    "options": ["fin", "tail", "gill", "scale"],
    "correct_index": 0,
    "relation_type": "part-whole",
    "explanation": "A wing is a part of a bird; a fin is a part of a fish."
  },
  "source": "groq",
  "game_id": "verbal-analogies",
  "difficulty": 5,
  "language": "en",
  "cached_hash": "626f5f36cec5",
  "latency_ms": 899,
  "model": "openai/gpt-oss-120b",
  "tokens": { "prompt": 363, "completion": 251, "total": 614 }
}
1.6 Files Added/Modified
File	Type	Purpose
src/services/ai/groq-client.ts	🆕	Groq API wrapper
src/services/ai/prompts-base.ts	🆕	Original 7 prompts
src/services/ai/prompts-extended.ts	🆕	29 additional prompts
src/services/ai/prompts.ts	✏️	Merged base + extended
src/services/ai/generate.ts	🆕	Generation + cache logic
src/routes/ai.ts	🆕	POST /ai/generate, GET /ai/status
🎯 PART 2: Adaptive Difficulty Engine
2.1 Overview
Every game now has 15 calibrated difficulty levels. The engine adjusts
the player's level after each session based on accuracy.

2.2 Difficulty as a Vector
Instead of "level 5", each level defines a full difficulty vector:

Example — seq-mem Level 5:

json
{
  "level": 5,
  "label": "6 digits",
  "levers": {
    "sequence_length": 6,
    "time_limit_ms": 10000,
    "distractor_count": 0
  },
  "calibrated_difficulty": 0.45,
  "domain_loadings": { "memory": 1.0 }
}
2.3 The Engine Loop
text
After each session:
  1. Get player_game_ability (or init if new)
  2. Decide next level based on accuracy:
     - >= 85% × 2 rounds → PROMOTE
     - < 60% → DEMOTE
     - 3 consecutive fails → HOLD_FRUSTRATION
     - else → HOLD_IN_BAND
  3. Update ability via EMA
  4. Log decision in engine_decisions
2.4 The 10 Reason Codes
text
PROMOTE_STABLE       — Excellent performance → move up
DEMOTE_STRUGGLE      — Poor performance → move down
HOLD_IN_BAND         — In target zone, stay
HOLD_FRUSTRATION     — 3+ fails, rebuild momentum
RECOVERY             — Serve easier round
WARMUP               — Start of session
CALIBRATING          — Not enough data
RUST_RETURN          — Long gap since last play
STRETCH              — User opted for challenge
FIRST_SESSION        — Never played this game
2.5 Thresholds
Rule	Value
PROMOTE_THRESHOLD	accuracy >= 85
DEMOTE_THRESHOLD	accuracy < 60
PROMOTE_NEEDED	2 consecutive good rounds
FRUSTRATION_CAP	3 consecutive fails
MIN_LEVEL	1
MAX_LEVEL	15
2.6 EMA Ability Update
javascript
alpha = max(0.15, 1 / max(3, evidence_count))
new_ability = old_ability × (1 - alpha) + (accuracy/100) × alpha
new_uncertainty = max(0.05, old_uncertainty × 0.95)
Behavior:

First session: 0.30 → 0.53 (big jump)

After 10 sessions: small changes

After 100 sessions: tiny changes

2.7 Example — Real Output
Session 1 (accuracy 100%):

json
"engine": {
  "from_level": 3,
  "to_level": 3,
  "reason_code": "HOLD_IN_BAND",
  "explanation": "Staying at level 3 — great accuracy (100%), but let's confirm it's stable.",
  "predicted_success": 0.80
}
Session 2 (accuracy 100% again):

json
"engine": {
  "from_level": 3,
  "to_level": 4,
  "reason_code": "PROMOTE_STABLE",
  "explanation": "Moving to level 4 — you've hit 85%+ accuracy for 2 rounds in a row.",
  "predicted_success": 0.78
}
2.8 Files Added/Modified
File	Type	Purpose
src/migrations/006_difficulty.sql	🆕	3 new tables
src/services/difficulty/atlas.ts	🆕	36 games × 15 levels
src/services/difficulty/engine.ts	🆕	Adaptive decision engine
src/seed-atlas.ts	🆕	Seed 540 levels
src/routes/next.ts	🆕	GET /next, /decisions, /ability
src/routes/sessions.ts	✏️	Wired engine into POST /sessions
2.9 Database Schema
difficulty_configs (540 rows):

sql
CREATE TABLE difficulty_configs (
  id UUID PRIMARY KEY,
  game_id TEXT REFERENCES games(id),
  mode TEXT DEFAULT 'classic',
  level INT,
  label TEXT,
  levers JSONB,
  calibrated_difficulty REAL,
  domain_loadings JSONB,
  UNIQUE (game_id, mode, level)
);
player_game_ability:

sql
CREATE TABLE player_game_ability (
  user_id UUID,
  game_id TEXT,
  mode TEXT,
  ability REAL DEFAULT 0.5,
  uncertainty REAL DEFAULT 0.5,
  evidence_count INT DEFAULT 0,
  current_level INT DEFAULT 3,
  consecutive_successes INT DEFAULT 0,
  consecutive_failures INT DEFAULT 0,
  PRIMARY KEY (user_id, game_id, mode)
);
engine_decisions:

sql
CREATE TABLE engine_decisions (
  id UUID PRIMARY KEY,
  user_id UUID,
  session_id UUID,
  game_id TEXT,
  reason_code TEXT,
  mode TEXT,
  from_level INT,
  to_level INT,
  predicted_success REAL,
  chosen_level INT,
  policy_version INT DEFAULT 1,
  created_at TIMESTAMPTZ
);
🎯 PART 3: API Endpoints (Complete List)
3.1 All 14 Endpoints
#	Method	Path	Purpose
1	GET	/health	Server + DB status
2	GET	/domains	9 domains
3	GET	/games	36 games
4	GET	/sessions	Recent sessions
5	POST	/sessions	Ingest + derive + PB + badges + engine
6	GET	/profile	Full profile + recommendations
7	GET	/next/:gameId	Next level + config
8	GET	/decisions	Recent engine decisions
9	GET	/ability	Per-game ability
10	GET	/ai/status	AI availability + 36 games
11	POST	/ai/generate	Generate content
3.2 Example — Complete Session Flow
powershell
# 1. Get next level
GET /next/seq-mem
→ { level: 3, config: { levers: {...} } }

# 2. Play game (frontend)

# 3. Submit session
POST /sessions { raw trials }
→ {
    derived: { accuracy: 100, median_rt_ms: 2200 },
    pb: { is_new_pb: true, new_value: 100 },
    badges: [classic-gold, classic-silver, classic-bronze],
    engine: {
      from_level: 3,
      to_level: 3,
      reason_code: "HOLD_IN_BAND",
      explanation: "Staying at level 3..."
    }
  }

# 4. Check decisions
GET /decisions
→ { decisions: [{ reason_code: "HOLD_IN_BAND", ... }] }

# 5. Check ability
GET /ability
→ {
    abilities: [{
      game_id: "seq-mem",
      ability: 0.53,
      current_level: 3,
      consecutive_successes: 1
    }]
  }
🎯 PART 4: Difficulty Atlas — Per Game
4.1 Levers Used Per Game
Game	Levers
flanker	congruent_ratio, time_limit_ms, similarity
go-no-go	go_ratio, rt_window_ms, stimulus_similarity
task-switching	switch_rate, rule_complexity, time_per_trial_ms
vigilance	target_rate, sequence_length, duration_ms
mental-rotation	angle_deg, shape_complexity, time_limit_ms
corsi-blocks	sequence_length, show_duration_ms, gap_ms
map-memory	landmark_count, map_size, delay_ms
block-counter	layer_count, hidden_ratio, time_limit_ms
reaction	rt_window_ms, distractor_count, penalty
color-match	congruent_ratio, color_similarity, time_limit_ms
symbol-sprint	set_size, distractor_type, time_limit_ms
rapid-fire	rule_count, switch_rate, time_per_trial_ms
n-back	n_level, sequence_length, show_duration_ms
face-match	pair_count, delay_ms, similarity
pattern-recall	sequence_length, flash_duration_ms, recall_order
seq-mem	sequence_length, show_duration_ms, distractor_count
matrix-logic	feature_count, has_rotation, time_limit_ms
syllogisms	premise_count, subtlety, time_limit_ms
deduction	entity_count, premise_count, indirect_clues
argument-analyzer	option_count, subtlety, time_limit_ms
lexical-decision	word_frequency, prime_strength, non_word_ratio
vocabulary-elite	word_rarity, distractor_similarity, time_limit_ms
verbal-analogies	relation_complexity, distractor_similarity, time_limit_ms
word-scramble	word_length, hint_availability, time_limit_ms
alternative-uses	object_abstractness, time_limit_seconds
creative-connect	association_distance, hint_availability, time_limit_ms
story-spark	word_abstractness, time_limit_ms
idea-flow	category_abstractness, time_limit_seconds
micro-expressions	emotion_subtlety, duration_ms, face_count
tone-detector	tone_subtlety, option_count, time_limit_ms
empathy-engine	scenario_complexity, ambiguity, time_limit_ms
social-read	observation_count, complexity, time_limit_ms
hanoi	disk_count, move_limit
river-crossing	entity_count, constraint_count, time_limit_ms
gear-logic	gear_count, time_limit_ms
path-finder	maze_size, wall_density, time_limit_ms
4.2 Calibrated Difficulty Progression
All games follow this pattern:

text
Level 1:  0.10 difficulty   (easiest)
Level 5:  0.45 difficulty
Level 10: 0.82 difficulty
Level 15: 0.99 difficulty   (hardest)
Linear progression: d = 0.10 + (level-1) × 0.064

🎯 PART 5: Testing Results
5.1 AI Generation Tests
Game	Language	Latency	Source	Result
verbal-analogies	EN	899ms	groq	✅
micro-expressions	AR	2366ms	groq	✅ Arabic output
tone-detector	EN	1146ms	groq	✅
vigilance	EN	1113ms	groq	✅
color-match	EN	2574ms	groq	✅ 10 trials
corsi-blocks	AR	727ms	groq	✅
n-back	EN	2231ms	groq	✅
hanoi	EN	999ms	groq	✅
hanoi (2nd)	EN	instant	cache	✅ Cache hit
flanker	AR	1213ms	groq	✅ Arabic output
mental-rotation	EN	1214ms	groq	✅
5.2 Adaptive Engine Tests
Test	From	To	Reason Code	Status
Session 1 (100%)	3	3	HOLD_IN_BAND	✅
Session 2 (100%)	3	4	PROMOTE_STABLE	✅
5.3 Atlas Seed
text
✅ 36 games × 15 levels = 540 rows
Total in DB: 540
🎯 PART 6: Cost & Performance
6.1 API Costs
Service	Free Limit	Usage
Groq	1000 req/day	0-100/day
Neon	1GB × 100 DB	~5MB used
Current monthly cost: $0

6.2 Average Latency
Operation	Latency
Groq generation	700-2600ms
Cache hit	< 50ms
Engine decision	< 100ms
Session ingest	200-400ms
🎯 PART 7: What's Next
7.1 Next Priorities
#	Task	Est.
1	Frontend ↔ Backend Integration	4 days
2	Session Planner (GET /plan)	1 day
3	AI Coach Chat (POST /ai/chat)	2 days
4	Auth (Better Auth)	3 days
5	Sync Protocol	3 days
7.2 Known Limitations
⚠️ Frontend still uses localStorage (not connected to API)

⚠️ No auth (demo user only)

⚠️ No session planner yet

⚠️ No weekly insights yet

📎 Files Reference
Total files added this session: 12
Total lines added: ~2500

text
backend/src/
├── migrations/
│   └── 006_difficulty.sql              (NEW)
├── routes/
│   ├── ai.ts                            (NEW)
│   ├── next.ts                          (NEW)
│   └── sessions.ts                      (MODIFIED)
├── services/
│   ├── ai/
│   │   ├── groq-client.ts              (NEW)
│   │   ├── prompts-base.ts             (NEW)
│   │   ├── prompts-extended.ts         (NEW)
│   │   ├── prompts.ts                  (MODIFIED)
│   │   └── generate.ts                 (NEW)
│   └── difficulty/
│       ├── atlas.ts                    (NEW)
│       └── engine.ts                   (NEW)
└── seed-atlas.ts                        (NEW)
END OF IMPLEMENTATION LOG
'@
