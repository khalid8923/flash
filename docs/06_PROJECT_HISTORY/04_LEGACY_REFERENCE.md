# FLASH — التوثيق الكامل (الأجزاء 04 → 21)

**النسخة:** 1.0 | **التاريخ:** 2026-10-07
**الغرض:** استكمال توثيق PROJECT_HANDOFF

---

# 04 — شجرة الملفات والفولدرات

## 4.1 الشجرة الكاملة
D:\Flash
│
├── backend\ [Node.js + Fastify]
│ ├── src
│ │ ├── config
│ │ │ ├── env.ts ← قراءة + تحقق من env vars
│ │ │ └── db.ts ← PostgreSQL pool
│ │ ├── routes
│ │ │ ├── health.ts ← GET /health
│ │ │ ├── sessions.ts ← POST /sessions (main)
│ │ │ ├── games.ts ← GET /games, /domains
│ │ │ ├── profile.ts ← GET /profile, /sessions
│ │ │ ├── next.ts ← GET /next, /decisions, /ability
│ │ │ ├── plan.ts ← GET /plan
│ │ │ └── ai.ts ← AI endpoints
│ │ ├── schemas
│ │ │ └── session.ts ← Zod validation
│ │ ├── services
│ │ │ ├── users.ts ← demo user + change_seq
│ │ │ ├── derive.ts ← accuracy/medianRT/RCS
│ │ │ ├── pb.ts ← Personal Best
│ │ │ ├── badges.ts ← Badge unlocking
│ │ │ ├── recommendations.ts ← Rule-based recs
│ │ │ ├── planner.ts ← Daily Ritual
│ │ │ ├── difficulty
│ │ │ │ ├── atlas.ts ← 36 × 15 levels
│ │ │ │ └── engine.ts ← Adaptive Difficulty
│ │ │ └── ai
│ │ │ ├── groq-client.ts ← Groq API
│ │ │ ├── gemini-client.ts ← Gemini API (unused)
│ │ │ ├── prompts-base.ts ← 7 prompts
│ │ │ ├── prompts-extended.ts ← 29 prompts
│ │ │ ├── prompts.ts ← Merge
│ │ │ ├── generate.ts ← Content generation
│ │ │ ├── context.ts ← User profile builder
│ │ │ └── coach.ts ← Chat brain
│ │ ├── migrations
│ │ │ ├── 001_identity.sql
│ │ │ ├── 002_catalog.sql
│ │ │ ├── 003_facts.sql
│ │ │ ├── 004_derived.sql
│ │ │ ├── 005_ai.sql
│ │ │ ├── 006_difficulty.sql
│ │ │ └── 007_ai_coach.sql
│ │ ├── migrate.ts ← Migration runner
│ │ ├── seed.ts ← Seed: 9+36+15
│ │ ├── seed-atlas.ts ← Seed: 540 levels
│ │ └── server.ts ← Bootstrap
│ ├── .env ← Secrets (NOT in git)
│ ├── .env.example
│ ├── .gitignore
│ ├── package.json
│ ├── tsconfig.json
│ └── check-*.ts ← Debug scripts
│
├── frontend\ [الـ Dashboard القديم]
│ ├── dashboard
│ │ ├── FLASH.html ← Entry point
│ │ ├── flash.css ← ~900 lines
│ │ └── js
│ │ ├── flash-data.js ← v6.0 data
│ │ ├── flash-charts.js ← Canvas
│ │ └── flash-core.js ← Core logic
│ ├── games
│ │ ├── attention\ ← 4 games
│ │ ├── spatial\ ← 4 games
│ │ ├── speed\ ← 4 games
│ │ ├── memory\ ← 4 games
│ │ ├── logic\ ← 4 games
│ │ ├── language\ ← 4 games
│ │ ├── creativity\ ← 4 games
│ │ ├── emotional\ ← 4 games
│ │ ├── problem\ ← 4 games
│ │ ├── numerical\ ← (empty)
│ │ └── _template\ ← (empty)
│ └── shared
│ ├── i18n.js ← EN + AR
│ ├── settings.js ← Global settings
│ ├── flash-stages.js ← Universal stages
│ └── templates\ ← Legacy templates
│
└── docs
├── contracts
│ ├── 01_SESSION_SCHEMA.md
│ ├── 02_TRIAL_SCHEMA.md
│ ├── 03_POSTMESSAGE_PROTOCOL.md
│ └── 04_GAME_CATALOG.md
├── 05_BACKEND_FOUNDATION.md
├── 06_PLAYER_INTELLIGENCE.md
├── 07_AI_AND_ADAPTIVE_ENGINE.md
├── 08_AI_COACH_SESSION.md
├── 09_RECENT_SESSION.md
├── PROJECT_STATS.md
├── PROJECT_TREE.md
└── PROJECT_HANDOFF\ ← هذا الفولدر
├── 00_INDEX.md
├── 01_PROJECT_OVERVIEW.md
├── 02_PROJECT_HISTORY.md
├── 03_ARCHITECTURE.md
└── 04_TO_21_COMPLETE.md ← هذا الملف

D:\flash-cognitive-studio\ [الفرونت التجريبي - Antigravity]
└── frontend-clean
├── index.html
├── shared
│ ├── js\ (api, i18n, motion, router, state)
│ └── styles\ (tokens, motion) [+ 3 missing]
└── views
└── home.html

text

## 4.2 الفولدرات الرئيسية

| الفولدر | الغرض | حجم تقريبي |
|---|---|---|
| `backend/src/` | كل كود الباك | ~3000 سطر TS |
| `frontend/dashboard/` | لوحة التحكم | ~2000 سطر |
| `frontend/games/` | 36 لعبة | ~80,000 سطر |
| `frontend/shared/` | الأنظمة المشتركة | ~1500 سطر |
| `docs/` | التوثيق | ~10,000 سطر MD |

---

# 05 — جرد المكونات

## 5.1 Backend Services

### `services/derive.ts`
- **الغرض:** حساب metrics من الـ trials
- **Inputs:** `gameId`, `trials[]`
- **Outputs:** `{ n_trials, n_correct, accuracy, median_rt_ms, rcs, primary_score }`
- **يعتمد على:** `pool` (DB)
- **يُستخدم بواسطة:** `routes/sessions.ts`
- **حالة:** ✅ مكتمل

### `services/pb.ts`
- **الغرض:** تحديث Personal Best بعد كل جلسة
- **Inputs:** `{ userId, gameId, metric, direction, value, sessionId }`
- **Outputs:** `{ is_new_pb, previous_value, new_value }`
- **يعتمد على:** `pool`
- **حالة:** ✅ مكتمل

### `services/badges.ts`
- **الغرض:** فتح الشارات حسب قواعد
- **Inputs:** `{ userId, sessionId, mode, accuracy }`
- **Outputs:** `BadgeUnlock[]`
- **يعتمد على:** `pool`
- **حالة:** ✅ مكتمل

### `services/planner.ts`
- **الغرض:** بناء Daily Ritual من 3 جلسات
- **Inputs:** `userId`
- **Outputs:** `{ total_minutes, sessions[], rationale }`
- **يعتمد على:** `pool`, `recommendations`, `difficulty/atlas`
- **حالة:** ✅ مكتمل

### `services/recommendations.ts`
- **الغرض:** توصيات rule-based (6 قواعد)
- **Inputs:** `userId`, `limit`
- **Outputs:** `Recommendation[]`
- **حالة:** ✅ مكتمل

### `services/difficulty/atlas.ts`
- **الغرض:** تعريف 540 مستوى (36 لعبة × 15)
- **يحتوي:** `ATLAS_PART_1/2/3` → `ATLAS`
- **حالة:** ✅ مكتمل

### `services/difficulty/engine.ts`
- **الغرض:** محرك الصعوبة التكيفية
- **Exports:** `getOrInitAbility`, `decideNextLevel`, `applyDecision`, `getRecentDecisions`
- **Algorithms:** Weighted Staircase، EMA، Frustration Cap
- **حالة:** ✅ مكتمل

### `services/ai/groq-client.ts`
- **الغرض:** Groq API client
- **Model default:** من `.env`
- **Features:** JSON mode، timeout 30s، token tracking
- **حالة:** ✅ مكتمل

### `services/ai/prompts.ts` + `prompts-base.ts` + `prompts-extended.ts`
- **الغرض:** 36 prompt template
- **الإجمالي:** 36 لعبة مغطاة
- **حالة:** ✅ مكتمل

### `services/ai/generate.ts`
- **الغرض:** توليد محتوى AI + cache
- **Inputs:** `{ gameId, difficulty, language, exclude }`
- **Outputs:** `{ content, source, latency_ms, tokens }`
- **حالة:** ✅ مكتمل

### `services/ai/context.ts`
- **الغرض:** بناء USER_PROFILE block للـ LLM
- **يجمع:** sessions، domain_scores، PBs، badges، ability، decisions، plan
- **حالة:** ✅ مكتمل

### `services/ai/coach.ts`
- **الغرض:** الشات بوت
- **Routing:** AR → allam-2-7b، EN → gpt-oss-120b
- **Context Compression:** للعربي فقط
- **حالة:** ✅ مكتمل

## 5.2 Backend Routes

| Route | Purpose |
|---|---|
| `health.ts` | GET /health |
| `sessions.ts` | POST /sessions (الأهم) |
| `games.ts` | GET /games، /domains |
| `profile.ts` | GET /profile، /sessions |
| `next.ts` | GET /next/:gameId، /decisions، /ability |
| `plan.ts` | GET /plan |
| `ai.ts` | /ai/status، /ai/generate، /ai/chat، /ai/conversations |

## 5.3 Frontend Modules (القديم)

| الملف | الغرض |
|---|---|
| `i18n.js` | ترجمة EN/AR |
| `settings.js` | إعدادات عالمية + موسيقى |
| `flash-stages.js` | 8 مراحل |
| `flash-data.js` | البيانات (v6.0) |
| `flash-charts.js` | Canvas (Radar + Neural) |
| `flash-core.js` | منطق الداشبورد |

## 5.4 Frontend Modules (الجديد - Antigravity)

| الملف | الحالة |
|---|---|
| `api.js` | ✅ محدّث |
| `i18n.js` | ✅ محدّث |
| `motion.js` | ✅ محدّث |
| `router.js` | ⚠️ محتاج إصلاح |
| `state.js` | ✅ يعمل |
| `tokens.css` | ✅ كامل |
| `motion.css` | ✅ كامل |
| `layout.css` | ❌ مفقود |
| `components.css` | ❌ مفقود |
| `rtl.css` | ❌ مفقود |

---

# 06 — جرد الميزات الكامل

## 6.1 ميزات منفذة بالكامل

### 6.1.1 Shared Systems

**i18n**
- Description: ترجمة EN/AR + RTL
- User value: تجربة بلغتين
- Implementation: `FLASH_I18N.t(key)`
- Storage: `flash:lang`
- حالة: ✅

**settings**
- Description: إعدادات عالمية
- Features: theme، reducedMotion، highContrast، soundEnabled، soundVolume، musicEnabled، musicVolume، haptics، inputMode، autoSaveProgress، showPostGameInsights
- Music: 4 detuned oscillators (A2, E3, A3, E4) + LFO
- Storage: `flash:settings`
- حالة: ✅

**flash-stages**
- Description: 8 مراحل موحدة
- Stages: apprentice، journeyman، adept، specialist، sprinter، perfectionist، endless-runner، master
- Storage: `flash:stages:{gameId}`
- حالة: ✅

### 6.1.2 Games System

- 36 لعبة على 9 domains
- 8 ملفات لكل لعبة
- postMessage protocol
- 5 modes: classic، speed، endless، precision، daily
- PB + history + badges + missions
- حالة: ✅

### 6.1.3 Backend

- Fastify server
- Neon PostgreSQL (30 tables)
- 17 endpoint
- Idempotency (UNIQUE constraint)
- change_seq (per-user)
- حالة: ✅

### 6.1.4 AI Content Generation

- 36 prompt template
- Groq integration
- DB cache
- AR + EN support
- حالة: ✅

### 6.1.5 Adaptive Difficulty

- 540 levels
- 10 reason codes
- EMA + weighted staircase
- Frustration cap
- حالة: ✅

### 6.1.6 Session Planner

- Daily ritual (3 sessions)
- warmup/train/challenge
- حالة: ✅

### 6.1.7 AI Coach Chat

- Routes by language
- Context compression for AR
- Conversation persistence
- حالة: ✅

## 6.2 ميزات مخططة (لم تُنفذ)

| # | الميزة | الأولوية |
|---|---|---|
| 1 | Session Recap (تحليل بعد كل جلسة) | عالية |
| 2 | Weekly Insights (تقرير أسبوعي) | متوسطة |
| 3 | Auth (Better Auth) | عالية |
| 4 | Sync Protocol (offline-first) | عالية |
| 5 | Guest Migration | متوسطة |
| 6 | Deployment | عالية |

## 6.3 ميزات مقترحة

- Leaderboards
- Social features
- Push notifications
- Mobile app (PWA)
- ML model (بعد 1000+ sessions)
- Analytics dashboard
- Export/import

## 6.4 ميزات مرفوضة

| الميزة | السبب |
|---|---|
| React/Vue/Svelte | Framework lock-in |
| TypeScript في الفرونت | Build step |
| Tailwind | Framework |
| Bundlers (Vite/Webpack) | Build step |
| Testing frameworks | تعقيد غير ضروري |
| State management libs | غير ضرورية |
| Confetti/emojis | لا يناسب الجدية |
| Star ratings | gamification مبالغ |

---

# 07 — نظام AI الكامل

## 7.1 معمارية AI
User Action
↓
Backend API
↓
Language Detection (من الـ request)
↓
Route:
├── AR → allam-2-7b (SDAIA)
└── EN → gpt-oss-120b (OpenAI)
↓
Groq API
↓
Response
↓
Save to DB

text

## 7.2 الموديلات المستخدمة

| Model | Language | Context | Latency | Quality |
|---|---|---|---|---|
| `openai/gpt-oss-120b` | EN | Full | ~1000ms | ⭐⭐⭐⭐⭐ |
| `allam-2-7b` | AR | Compressed | ~600ms | ⭐⭐⭐⭐⭐ |
| `qwen/qwen3.8-27b` | Both | Full | ~1000ms | ⭐⭐ |
| `gemini-*` | Both | Very Large | Timeout | ❌ |

## 7.3 Prompt Templates (36)

### Base (7)
1. verbal-analogies — Sternberg 1977
2. vocabulary-elite — WAIS-IV
3. syllogisms — Aristotle
4. argument-analyzer — Abrami 2015
5. matrix-logic — Raven 1938
6. story-spark — Amabile 1982
7. alternative-uses — Guilford 1967

### Batch 1 (10)
8. deduction
9. word-scramble
10. lexical-decision
11. creative-connect
12. idea-flow
13. tone-detector
14. micro-expressions
15. empathy-engine
16. social-read
17. go-no-go

### Batch 2 (12)
18. vigilance
19. task-switching
20. color-match
21. symbol-sprint
22. rapid-fire
23. flanker
24. reaction
25. corsi-blocks
26. map-memory
27. block-counter
28. mental-rotation
29. pattern-recall

### Batch 3 (7)
30. n-back
31. seq-mem
32. face-match
33. hanoi
34. river-crossing
35. gear-logic
36. path-finder

## 7.4 نموذج Prompt

كل prompt فيه:
- **system:** يعلّم الموديل paradigm اللعبة + SAFETY_RULES
- **build:** يبني الـ user prompt مع difficulty + language + exclude
- **schema:** اسم الـ schema للـ response

## 7.5 Context Compression للعربي

```typescript
const compactCtx = ctxBlock.length > 1000
  ? ctxBlock.slice(0, 1000) + '\n[...]'
  : ctxBlock;
const compactSys = SYSTEM_PROMPT_AR + '\n\n' + compactCtx;

// آخر رسالتين فقط
const lastTwo = priorMsgs.slice(-2);
7.6 AI Coach System Prompts
EN
Careful analyst, not cheerleader

No diagnosis

No IQ claims

Cite specific data

2-5 sentences default

AR
يتكلم بالعربية دائمًا

يفهم اللهجة المصرية

لا يسأل "رسالتك غير واضحة"

يجيب مباشرة

7.7 Adaptive Difficulty Engine
Weighted Staircase
text
PROMOTE: بعد 2 جلسات >= 85%
DEMOTE: جلسة واحدة < 60%
FRUSTRATION_CAP: 3 fails متتالية
EMA Update
javascript
alpha = max(0.15, 1 / max(3, evidence_count))
new_ability = old × (1 - alpha) + (accuracy / 100) × alpha
new_uncertainty = max(0.05, old_uncertainty × 0.95)
10 Reason Codes
PROMOTE_STABLE

DEMOTE_STRUGGLE

HOLD_IN_BAND

HOLD_FRUSTRATION

RECOVERY

WARMUP

CALIBRATING

RUST_RETURN

STRETCH

FIRST_SESSION

7.8 استراتيجية Model Selection
اخترنا Groq على:

✅ مجاني بسخاء

✅ سرعة فائقة

✅ Models متنوعة

✅ JSON mode

رفضنا Gemini بسبب:

❌ Model deprecation

❌ Timeouts

❌ API key restrictions

رفضنا OpenAI GPT-4 بسبب:

❌ تكلفة عالية

❌ Rate limits

7.9 حدود AI الحالية
لا يحفظ ذاكرة طويلة المدى (context من DB كل مرة)

محتاج online

Rate limit على Groq (~1000 req/day)

Context window صغير للعربي (allam-2-7b)

لا يدرب موديل خاص

7.10 الخطط المستقبلية للـ AI
ML model بعد 1000+ sessions

Personalized recommendations

Predictive performance

Fine-tuned Arabic model

08 — منطق الألعاب الـ36
8.1 Domain: Attention (4)
flanker
Paradigm: Eriksen & Eriksen (1974)

Mechanic: تمييز اتجاه سهم مع flankers

Metric: flanker_effect_ms

Direction: lower is better

RT floor: 150ms

Max trials: 200

Files: 9 (has tutorial)

go-no-go
Paradigm: Drewe (1975)

Mechanic: اضغط لـ go، اكبح لـ no-go

Metric: d_prime

Direction: higher is better

Files: 10 (has DDM + analytics)

task-switching
Paradigm: Monsell (2003)

Mechanic: تبديل بين قواعد

Metric: switch_cost_ms

Direction: lower is better

vigilance
Paradigm: Rosvold (1956) — CPT-X

Mechanic: اضغط عند رؤية X

Metric: d_prime

Direction: higher

8.2 Domain: Spatial (4)
mental-rotation
Shepard & Metzler (1971)

3D object rotation

Metric: accuracy

corsi-blocks
Corsi (1972)

تسلسل بصرّي مكاني

Metric: max_span

map-memory
Postma & De Haan (1996)

14×12 grid + landmarks

Metric: accuracy

block-counter
KABC

isometric voxels

Metric: accuracy

8.3 Domain: Speed (4)
reaction
Simple RT

Metric: median_rt_ms (lower)

color-match
Stroop (1935)

Metric: stroop_effect_ms (lower)

symbol-sprint
Treisman & Gelade (1980)

Visual search

Metric: search_slope_ms

rapid-fire
Monsell (2003)

Multi-rule switching

Metric: switch_cost_ms

8.4 Domain: Memory (4)
n-back
Jaeggi (2008)

Working memory

Metric: max_n_level

face-match
Naveh-Benjamin (2000)

SVG faces + names

Metric: accuracy

pattern-recall
Corsi (1972)

4×4 grid

Metric: max_span

seq-mem
Miller (1956)

Forward digit span

Metric: max_span

8.5 Domain: Logic (4)
matrix-logic
Raven (1938)

Metric: accuracy

syllogisms
Aristotle

Metric: accuracy

deduction
Evans (2008)

Metric: accuracy

argument-analyzer
Abrami (2015)

Metric: accuracy

8.6 Domain: Language (4)
lexical-decision
Meyer & Schvaneveldt (1971)

Metric: priming_effect_ms

vocabulary-elite
WAIS-IV

Metric: accuracy

verbal-analogies
Sternberg (1977)

Metric: accuracy

word-scramble
Lexical access

Metric: accuracy

8.7 Domain: Creativity (4)
alternative-uses
Guilford (1967)

Metric: novelty_score

creative-connect
Mednick (1962)

Remote Associates

Metric: accuracy

story-spark
Amabile (1982)

Metric: novelty_score

idea-flow
Guilford

Metric: fluency

Status: wip

8.8 Domain: Emotional (4)
micro-expressions
Ekman & Friesen (1969)

Metric: hard_emotion_accuracy

tone-detector
MSCEIT

Metric: accuracy

empathy-engine
Ickes (1993)

Metric: accuracy

social-read
Burgoon (1994)

Metric: accuracy

8.9 Domain: Problem Solving (4)
hanoi
Simon (1975)

Metric: optimal_move_ratio

river-crossing
Simon & Newell (1971)

Metric: optimal_move_ratio

gear-logic
Hegarty (2004)

Metric: accuracy

path-finder
Shallice (1982)

Metric: optimal_path_ratio

8.10 الـ 5 Modes لكل لعبة
Mode	Trials	Time	On error
classic	3/level → 45	عادي	فقدان حياة
speed	20	قصير/سريع	لا يوجد
endless	∞	متزايد	نهاية اللعبة
precision	15	لا يوجد	خطأ فقط
daily	20-30	ثابت	خطأ فقط
8.11 الـ 8 Stages
Apprentice 🥉 — Level 5

Journeyman 🥈 — Level 10

Adept 🥇 — Level 15

Specialist 🎯 — مقياس خاص

Sprinter ⚡ — Speed mode

Perfectionist 💎 — 100%

Endless Runner 🏃 — Level 6

Master 👑 — Beat PB

09 — قاعدة البيانات (30 جدول)
9.1 Identity (2)
users
sql
id UUID PK
email TEXT UNIQUE
email_verified_at TIMESTAMPTZ
display_name TEXT
created_at TIMESTAMPTZ
deleted_at TIMESTAMPTZ
leaderboard_eligible BOOLEAN
devices
sql
id UUID PK
user_id UUID FK
label TEXT
first_seen_at TIMESTAMPTZ
last_seen_at TIMESTAMPTZ
revoked_at TIMESTAMPTZ
9.2 Catalog (5)
domains
sql
id TEXT PK (attention، spatial، speed، memory، logic، language، creativity، emotional، problem)
name TEXT
icon TEXT
color TEXT
games
sql
id TEXT PK (slug like 'seq-mem')
name TEXT
domain_id TEXT FK
trial_pattern TEXT
primary_metric TEXT
metric_direction TEXT (higher|lower)
rt_floor_ms INT
rt_ceiling_ms INT
max_trials_per_session INT
min_duration_ms INT
max_duration_ms INT
max_score INT
trial_exclusion_rules JSONB
game_version TEXT
scoring_version INT
status TEXT (ready|wip|disabled)
game_domain_weights
sql
game_id + domain_id PK
weight REAL
badges
sql
id TEXT PK
name TEXT
tier TEXT (bronze|silver|gold|platinum)
rule JSONB
rule_version INT
norms
sql
game_id + variant + metric + scoring_version PK
mean REAL
sd REAL
percentiles JSONB
sample_size INT
source TEXT
9.3 Facts (2)
sessions (append-only)
sql
id UUID PK
user_id UUID FK
client_session_id UUID UNIQUE with user_id
device_id UUID FK
game_id TEXT FK
domain_id TEXT FK
mode TEXT
seed TEXT
ticket_id TEXT
started_at TIMESTAMPTZ
ended_at TIMESTAMPTZ
server_received_at TIMESTAMPTZ
duration_ms INT
n_trials INT
n_correct INT
accuracy REAL
median_rt_ms REAL
rcs REAL
primary_score REAL
game_version TEXT
scoring_version INT
trust_tier TEXT
source TEXT (live|offline|legacy_import)
status TEXT
anomaly_score REAL
change_seq BIGINT
deleted_at TIMESTAMPTZ
session_trials
sql
session_id UUID PK FK
trial_schema_version INT
trials JSONB
9.4 Derived (4)
personal_bests
sql
user_id + game_id + variant + metric PK
value REAL
session_id UUID FK
achieved_at TIMESTAMPTZ
user_game_stats
sql
user_id + game_id + variant PK
sessions_count INT
recent_speed REAL
recent_accuracy REAL
recent_efficiency REAL
normalized_z REAL
confidence REAL
last_played_at TIMESTAMPTZ
scoring_version INT
norms_version INT
domain_scores
sql
user_id + domain_id PK
score REAL
confidence REAL
games_contributing INT
profile_version INT
computed_at TIMESTAMPTZ
user_badges
sql
user_id + badge_id PK
unlocked_at TIMESTAMPTZ
source_session_id UUID FK
revoked_at TIMESTAMPTZ
9.5 Sync + Ops (6)
user_sync_state
sql
user_id UUID PK
change_seq BIGINT
data_epoch INT
profile_dirty BOOLEAN
user_settings
sql
user_id + key PK
value JSONB
changed_at TIMESTAMPTZ
device_id UUID
play_tickets
sql
id UUID PK
user_id UUID FK
game_id TEXT FK
seed TEXT
issued_at TIMESTAMPTZ
expires_at TIMESTAMPTZ
consumed_at TIMESTAMPTZ
integrity_events
sql
id BIGSERIAL PK
session_id UUID
user_id UUID
rule TEXT
severity TEXT
detail JSONB
created_at TIMESTAMPTZ
import_batches
sql
id UUID PK
user_id UUID FK
device_id UUID
payload_hash TEXT
counts JSONB
status TEXT
committed_at TIMESTAMPTZ
_migrations
sql
filename TEXT PK
applied_at TIMESTAMPTZ
9.6 AI (6)
generated_content_cache
sql
id UUID PK
game_id TEXT FK
difficulty INT
content_hash TEXT UNIQUE with game_id + difficulty
content JSONB
generated_at TIMESTAMPTZ
used_count INT
user_cognitive_profile
sql
user_id UUID PK
domain_scores JSONB
strengths JSONB
weaknesses JSONB
learning_rate REAL
consistency REAL
profile_version INT
computed_at TIMESTAMPTZ
ai_recommendation_log
sql
id UUID PK
user_id UUID FK
recommendation_type TEXT
payload JSONB
user_action TEXT
created_at TIMESTAMPTZ
adaptive_difficulty_state
sql
user_id + game_id PK
current_difficulty INT
target_difficulty INT
adjustments JSONB
updated_at TIMESTAMPTZ
ai_conversations
sql
id UUID PK
user_id UUID FK
title TEXT
language TEXT (en|ar)
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
ai_messages
sql
id UUID PK
conversation_id UUID FK
role TEXT (user|assistant|system)
content TEXT
tokens_prompt INT
tokens_completion INT
latency_ms INT
created_at TIMESTAMPTZ
9.7 Difficulty (3)
difficulty_configs (540 rows)
sql
id UUID PK
game_id TEXT FK
mode TEXT
level INT (1-15)
label TEXT
levers JSONB
calibrated_difficulty REAL
domain_loadings JSONB
UNIQUE (game_id, mode, level)
player_game_ability
sql
user_id + game_id + mode PK
ability REAL
uncertainty REAL
evidence_count INT
current_level INT
consecutive_successes INT
consecutive_failures INT
last_session_id UUID FK
last_updated_at TIMESTAMPTZ
engine_decisions
sql
id UUID PK
user_id UUID FK
session_id UUID FK
game_id TEXT FK
reason_code TEXT
mode TEXT
from_level INT
to_level INT
predicted_success REAL
chosen_level INT
policy_version INT
created_at TIMESTAMPTZ
10 — نظام UI/UX
10.1 فلسفة التصميم
الفرونت القديم:

Dark + Cyan/Pink gradient

Glassmorphism

Card-based

Space Grotesk + Inter

الفرونت الجديد (The Folio Hand):

Vellum + Ink + Rubric Red

Manuscript / Forensic editorial

No cards — hairlines only

Fraunces + Martian Mono + Amiri

10.2 الألوان (الجديد)
Light Theme
text
--vellum:    #EFE7D3
--ink:       #1E2230
--ink-aged:  #6E4B2C
--rubric:    #B2341A
--gilt:      #8E6410
--drypoint:  #BDB29A
--muted:     #6E4B2C
Dark Theme
text
--vellum:    #22181F
--ink:       #EADFC8
--ink-aged:  #A9774A
--rubric:    #E8683F
--gilt:      #D8A94A
--drypoint:  #4F4048
--muted:     #A9774A
10.3 الخطوط
الدور	الخط	Size
Display	Fraunces	Hero: 9rem, H1: 2.5rem, H2: 1.5rem
Body	Martian Mono	1rem
Label	Martian Mono	0.6875rem + letter-spacing
Arabic Display	Amiri	+12%
Arabic Body	Cairo	+12%
10.4 Motion System (The Folio Hand)
Verbs الأربعة
Draw — يرسم خط (rule, stroke)

Set — يظهر فورًا (stamp)

Count — يعد الرقم

Cover — leaf vellum

The Entry (Signature)
خط أحمر يترسم من inline-start

الرقم يطلع من الخط (clip-path)

4 corner marks تُوضع في فريم واحد

Duration: clamp(160, 120 + 0.45 × px, 440) ms

Easing
--ease-draw: cubic-bezier(.4,0,.1,1) (pen)

--ease-set: cubic-bezier(.2,0,0,1) (typebar)

--ease-turn: cubic-bezier(.6,0,.2,1) (leaf)

10.5 RTL Support
--s: -1 (direction)

--origin: right

Logical properties فقط: inset-inline-start, margin-inline, padding-block

Arabic: font-size +12%، line-height 1.75، letter-spacing 0

10.6 الـ Components الرئيسية
Game Card (القديم)
Card bg + border + icon + name + desc + progress + score + button

Rod (الجديد)
Hairline + bead on level + name + RT

Specimen (الجديد)
Label + title + meta + reason

No card box، hairlines only

Entry
Big numeral + red rule + 4 marks

10.7 Responsive
Breakpoint	Changes
Desktop (>1024px)	Two-column layout
Tablet (≤1024px)	One-column + vertical stack
Mobile (≤700px)	Smaller hero + tighter gaps
10.8 Accessibility
prefers-reduced-motion → --m: 0

High contrast mode

Focus-visible outlines

ARIA labels

Semantic HTML

11 — المشاكل المعروفة
11.1 FIXED
BUG-001: Duplicate renderTabs
الوصف: دالتان بنفس الاسم في flash-core.js

السبب: copy-paste error

الحل: إزالة الأول، الإبقاء على الثاني

Status: ✅ FIXED

BUG-002: PostgreSQL BOM error
الوصف: syntax error at or near "" في migrations

السبب: Out-File -Encoding UTF8 بيضيف BOM (3 bytes)

الحل: readFileSync(...).replace(/^\uFEFF/, '')

Status: ✅ FIXED

BUG-003: AUTH_SECRET قصير
الوصف: Zod رفض القيمة الافتراضية (28 char)

الحل: Auto-generate 64-char secret

Status: ✅ FIXED

BUG-004: Groq model deprecated
الوصف: llama-3.3-70b-versatile لم يعد موجود

الحل: التغيير إلى openai/gpt-oss-120b

Status: ✅ FIXED

BUG-005: Arabic not understood
الوصف: gpt-oss-120b بيرد "رسالتك غير واضحة"

الحل: Routing إلى allam-2-7b للعربي

Status: ✅ FIXED

BUG-006: Arabic context overflow
الوصف: allam-2-7b رفض لأن context كبير

الحل: Compress context + last 2 messages فقط

Status: ✅ FIXED

BUG-007: EADDRINUSE port 3000
الوصف: Backend refused to start

الحل: Get-Process node | Stop-Process -Force

Status: ✅ FIXED

11.2 OPEN
BUG-101: Antigravity CSS files missing
الوصف: 3 ملفات CSS غير موجودة (layout، components، rtl)

Symptoms: http-server 404 على الملفات

السبب: الأداة ما كتبتهمش بشكل صح

Workaround: كتابتهم يدويًا في المحرر

Status: 🔴 OPEN

Priority: Medium

BUG-102: PowerShell Access Denied
الوصف: فشل كتابة ملفات في Antigravity folder

السبب: المحرر أو السيرفر بيمسك على الملفات

Workaround: إغلاق كل التطبيقات، أو الكتابة من المحرر

Status: 🔴 OPEN

Priority: Low

BUG-103: Session Recap لم يُنفّذ
الوصف: لا يوجد AI-generated recap بعد كل جلسة

Status: 🔴 OPEN (planned)

BUG-104: Auth غير موجود
الوصف: كله demo user

Status: 🔴 OPEN (planned)

BUG-105: Sync غير موجود
الوصف: لا يوجد مزامنة بين الأجهزة

Status: 🔴 OPEN (planned)

11.3 PARTIALLY FIXED
BUG-201: Arabic encoding in PowerShell
الوصف: العربي بيتحول لـ ???

Partial fix: charset=utf-8 + save to file

Real fix: الفرونت الحقيقي (fetch) بيستخدم UTF-8 تلقائي

Status: 🟡 PARTIAL

BUG-202: Emojis in PowerShell scripts
الوصف: parse errors

Workaround: شيل الإيموجي من .ps1

Status: 🟡 PARTIAL

11.4 UNKNOWN
BUG-301: map-memory layout issue
الوصف: تقرير قديم عن broken layout

Status: [NEEDS CONFIRMATION]

BUG-302: face-match folder name
الوصف: اسم الفولدر كان فيه حرف عربي في السابق

Status: ✅ تم إصلاحه (renamed to face-match)

12 — سجل القرارات
Decision 1: Vanilla JS over React/Vue/Svelte
Context: كل لعبة محتاجة self-contained

القرار: Vanilla فقط

السبب: تشتغل من file:// بدون build

البدائل: React, Vue, Svelte — رُفضوا لأنهم يحتاجون build

Status: ✅ Enforced

Decision 2: iframe لكل لعبة
Context: isolation بين الألعاب والـ dashboard

القرار: iframe + postMessage

السبب: namespace isolation، crash isolation، standalone testing

البدائل: Web Components، Shadow DOM — رُفضوا

Status: ✅ Enforced

Decision 3: 8 ملفات لكل لعبة
Context: pattern موحد

القرار: 8 ملفات بالضبط

السبب: فصل المسؤوليات، ملفات < 800 سطر

Status: ✅ Enforced

Decision 4: localStorage
Context: مفيش backend في البداية

القرار: localStorage بصيغة flash:{game-id}:{type}

Status: ✅ Enforced (الفرونت القديم)

Decision 5: postMessage Protocol
Context: التواصل بين game و dashboard

القرار: 7 core + 4 extended fields

Status: ✅ Enforced

Decision 6: Fastify over Express/NestJS
Context: Framework للباك

القرار: Fastify 5.1

السبب: 3x أسرع من Express، schema validation مدمج، TS-first

Status: ✅ Enforced

Decision 7: Neon PostgreSQL
Context: Database

القرار: Neon (serverless Postgres)

السبب: مجاني، لا يتوقف، PostgreSQL كامل

Status: ✅ Enforced

Decision 8: Groq for AI
Context: LLM provider

القرار: Groq (gpt-oss-120b + allam-2-7b)

البدائل: OpenAI (مدفوع)، Gemini (deprecated)

Status: ✅ Enforced

Decision 9: Language-based model routing
Context: allam-2-7b ممتاز للعربي، gpt-oss ممتاز للإنجليزي

القرار: Route by language

Status: ✅ Enforced

Decision 10: Append-only facts
Context: sessions immutable

القرار: sessions + session_trials append-only

السبب: idempotency + sync-friendly

Status: ✅ Enforced

Decision 11: The Folio Hand (Frontend Redesign)
Context: redesign كامل للفرونت

القرار: استخدام The Folio Hand (editorial / manuscript)

البدائل: Hundred Greys، Hard Noon (رفضوا)

Status: 🟡 In Progress (Antigravity)

Decision 12: Demo User
Context: auth غير جاهز

القرار: demo user UUID ثابت

Status: ✅ Temporary

Decision 13: Context Compression for Arabic
Context: allam-2-7b عنده 4K context

القرار: ضغط USER_PROFILE + آخر رسالتين فقط

Status: ✅ Enforced

Decision 14: AI Model Fallback
Context: لو Groq فشل

القرار: error واضح، مفيش fallback تلقائي

السبب: لسه بدري للـ multi-provider fallback

Status: ✅ Current

13 — المناهج المرفوضة
13.1 Frontend Frameworks
ما جرّبناه: النظر في React لتصميم جديد

النتيجة: رُفض — نحتاج vanilla

البديل: The Folio Hand (vanilla)

13.2 TypeScript في الفرونت
السبب للرفض: build step

البديل: vanilla JS

13.3 Vite/Webpack
السبب للرفض: build step

البديل: فتح ملفات مباشرة

13.4 Tailwind
السبب للرفض: framework lock-in

البديل: vanilla CSS

13.5 Gemini للعربي
جرّبناه: Gemini 2.5 Flash، ثم 3.8 Flash

النتيجة: model deprecated، ثم timeout

البديل: allam-2-7b (Groq)

13.6 qwen/qwen3.8-27b
جرّبناه: لتعدد اللغات

النتيجة: ضعيف في العربي والإنجليزي

البديل: model routing

13.7 Star Ratings للألعاب
السبب للرفض: gamification مبالغ

البديل: levels + accuracy

13.8 Emojis في UI
السبب للرفض: يقلل الجدية

البديل: SVG marks + hairlines

13.9 Confetti
السبب للرفض: نفس السبب

البديل: The Entry animation

13.10 CSS Frameworks (Bootstrap)
السبب للرفض: framework lock-in

13.11 Testing Frameworks (Jest, Vitest)
السبب للرفض: تعقيد غير ضروري

البديل: manual testing

13.12 State Management (Redux, Zustand)
السبب للرفض: غير ضرورية لـ vanilla

البديل: observer pattern بسيط

13.13 Reduction of Games
السبب للرفض: 36 هو الحد الأدنى

البديل: 36 fixed

13.14 Skipping the 8-File Pattern
السبب للرفض: pattern مقدس

14 — الحالة الحالية بالضبط
14.1 ما تم إنجازه
✅ 36 لعبة × 8 ملفات

✅ Dashboard قديم يعمل

✅ 4 contracts

✅ Backend Fastify + Neon

✅ 30 جدول DB

✅ 17 endpoint

✅ Seed كامل (9+36+15+540)

✅ AI Content Generation (36 لعبة)

✅ Adaptive Difficulty Engine (36 لعبة)

✅ Session Planner (Daily Ritual)

✅ AI Coach Chat (AR + EN)

✅ Conversation persistence

✅ PB + Badges

✅ Idempotency

14.2 ما يعمل حاليًا
Backend على port 3000

Frontend القديم على FLASH.html

Database على Neon (cloud)

AI يعمل (Groq)

36 لعبة في الفرونت القديم

14.3 ما يعمل جزئيًا
Antigravity Frontend (متوقف)

3 CSS files مفقودة

14.4 ما هو مكسور
Antigravity CSS files

Access Denied على فولدر Antigravity

14.5 ما تبقى
#	المهمة	الوقت
1	Session Recap	3h
2	Weekly Insights	3h
3	Auth (Better Auth)	3 days
4	Sync Protocol	3 days
5	Frontend Integration (36 games → Backend)	4 days
6	Deployment	1 day
14.6 الأولوية الحالية
Backend Feature Completion:

Session Recap

Weekly Insights

14.7 المهمة التالية الفورية
Session Recap — بعد كل جلسة، الـ AI يكتب تحليل

14.8 المهام متوسطة المدى
Auth

Sync

Frontend Integration

14.9 المهام طويلة المدى
Deployment

User accounts

Multi-device sync

Mobile support

14.10 الموانع (Blockers)
Antigravity CSS files missing

PowerShell Access Denied

14.11 Technical Debt
No tests

No deployment config

Auth = demo user only

No sync

Frontend old (not The Folio Hand)

15 — خريطة الطريق
15.1 HIGH PRIORITY
15.1.1 Session Recap (IMPLEMENTED? → NO, PLANNED)
Description: بعد كل جلسة، الـ AI يكتب تحليل بالعربي/الإنجليزي

User value: يفهم المستخدم أدائه

Implementation: POST /ai/recap مع session_id

Dependencies: sessions + AI Coach

حالة: PLANNED

15.1.2 Weekly Insights (PLANNED)
Description: تقرير أسبوعي للـ AI

User value: رؤية التقدم طويل المدى

حالة: PLANNED

15.1.3 Auth (PLANNED)
Description: Better Auth + email/password

User value: مستخدمون حقيقيون

حالة: PLANNED

15.1.4 Sync Protocol (PLANNED)
Description: مزامنة بين الأجهزة

User value: استمرارية

حالة: PLANNED

15.1.5 Deployment (PLANNED)
Description: نشر على Render + Cloudflare

حالة: PLANNED

15.2 MEDIUM PRIORITY
15.2.1 Guest Migration (PLANNED)
نقل بيانات localStorage للسحابة

15.2.2 Frontend Polish (PLANNED)
3 CSS files + views

15.2.3 Content Validator (PLANNED)
طبقة تحقق من محتوى AI

15.2.4 Tests (PLANNED)
Manual + some automated

15.3 LOW PRIORITY
Leaderboards

Social features

Push notifications

15.4 FUTURE / EXPERIMENTAL
ML model (after 1000+ sessions)

Mobile app (PWA/React Native)

Analytics dashboard

VR/AR versions

Multiplayer

15.5 IDEAS (not planned)
Community challenges

Export/import progress

Peer comparison (opt-in)

Voice mode

16 — إعداد التطوير
16.1 المتطلبات
OS: Windows 10/11

Node.js: 20+

npm: 10+

PowerShell: default

Editor: VS Code أو Antigravity

Browser: Modern Chrome

16.2 الخطوات
bash
# Backend
cd D:\Flash\backend
npm install
npm run migrate
npm run seed
npm run seed:atlas
npm run dev

# Frontend (القديم)
فتح D:\Flash\frontend\dashboard\FLASH.html

# Frontend (الجديد - Antigravity)
cd D:\flash-cognitive-studio\frontend-clean
npx http-server -p 8080 -c-1
16.3 Package Manager
npm (مفيش yarn/pnpm)

16.4 Runtime Versions
Tech	Version
Node.js	>=20.0.0
npm	>=10.0.0
PostgreSQL	17 (Neon)
16.5 Environment Variables
text
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info

DATABASE_URL=postgresql://[SECRET REDACTED]@[HOST]/flashdb?sslmode=verify-full

AUTH_SECRET=[SECRET REDACTED]
AUTH_URL=http://localhost:3000

GROQ_API_KEY=[SECRET REDACTED]
GROQ_MODEL_EN=openai/gpt-oss-120b
GROQ_MODEL_AR=allam-2-7b

GEMINI_API_KEY=[SECRET REDACTED]
GEMINI_MODEL=gemini-flash-latest

CORS_ORIGIN=http://localhost:5173,http://localhost:8080
16.6 الخدمات المطلوبة
Neon PostgreSQL (cloud)

Groq API (cloud)

16.7 API Keys المطلوبة
GROQ_API_KEY — من console.groq.com

GEMINI_API_KEY — من aistudio.google.com (اختياري)

17 — الحزم والاعتماديات
17.1 Backend Dependencies
Package	Version	Purpose
fastify	5.1.0	Web framework
@fastify/cors	10.0.1	CORS
@fastify/rate-limit	10.1.1	Rate limiting
pg	8.13.1	PostgreSQL driver
zod	3.23.8	Validation
dotenv	16.4.5	Env vars
17.2 Backend Dev Dependencies
Package	Version
typescript	5.6.3
tsx	4.19.2
@types/node	22.9.0
@types/pg	8.11.10
17.3 Frontend Dependencies
None — vanilla HTML/CSS/JS

17.4 Antigravity Frontend
React (في package.json — يجب إزالته)

Tailwind (يجب إزالته)

Vite (يجب إزالته)

17.5 External Services
Groq API (free tier)

Neon PostgreSQL (free tier)

Google Fonts (CDN)

17.6 Fonts
Space Grotesk

Inter

JetBrains Mono

Cairo

Fraunces (new)

Martian Mono (new)

Amiri (new)

18 — الأوامر والـ Prompts
18.1 PowerShell Commands
Backend
powershell
cd D:\Flash\backend
npm run dev
npm run migrate
npm run seed
npm run seed:atlas
Kill node
powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Project Stats
powershell
Get-ChildItem "D:\Flash" -Recurse -File -Force | Where-Object { $_.FullName -notmatch 'node_modules|\.git|dist' } | Measure-Object -Property Length -Sum
18.2 API Test Commands
Test AI Chat (Arabic)
powershell
$body = @{ message = "إيه اللي ألعبه النهاردة؟"; language = 'ar' } | ConvertTo-Json
$body | Out-File -Encoding utf8 "$env:TEMP\ar.json"
Invoke-RestMethod -Uri 'http://localhost:3000/ai/chat' -Method Post -InFile "$env:TEMP\ar.json" -ContentType 'application/json; charset=utf-8'
Test AI Chat (English)
powershell
$body = @{ message = "What should I play today?"; language = 'en' } | ConvertTo-Json
$body | Out-File -Encoding utf8 "$env:TEMP\en.json"
Invoke-RestMethod -Uri 'http://localhost:3000/ai/chat' -Method Post -InFile "$env:TEMP\en.json" -ContentType 'application/json; charset=utf-8'
Test Session Submit
powershell
$sessionId = [guid]::NewGuid().ToString()
$body = @{
  schema_version = 1
  client_session_id = $sessionId
  game_id = 'seq-mem'
  domain_id = 'memory'
  mode = 'classic'
  seed = 'test1234abcd5678'
  ticket_id = $null
  started_at = (Get-Date).AddMinutes(-2).ToUniversalTime().ToString('o')
  ended_at = (Get-Date).ToUniversalTime().ToString('o')
  game_version = '1.0.0'
  scoring_version = 1
  trials = @(
    @{ index=0; rt_ms=2000; correct=$true; is_practice=$false; stimulus=@{}; response=@{} }
  )
  config = @{ max_lives=3 }
  client_meta = @{ user_agent='PS'; viewport=@{w=1920;h=1080}; device_id='test'; device_clock_skew_ms=$null }
  source = 'live'
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri 'http://localhost:3000/sessions' -Method Post -Body $body -ContentType 'application/json'
18.3 AI System Prompts (Key Extracts)
SYSTEM_PROMPT_EN (Coach)
text
You are the FLASH Coach — a careful, evidence-minded guide.

WHO YOU ARE:
- A thoughtful analyst, not a cheerleader
- Never diagnose, never claim medical benefits
- Tell the truth about what the data shows

HOW TO ANSWER:
- Concise (2-5 sentences)
- Cite specific data
- If unsure, say so

DO NOT:
- Diagnose
- Claim IQ boost
- Use hype words
SYSTEM_PROMPT_AR (Coach)
text
أنت "مدرب FLASH" — مرشد دقيق

قواعد مهمة:
- تتكلم بالعربية دائمًا
- افهم اللهجة المصرية
- لا تسأل "رسالتك غير واضحة"
- أجب مباشرة

ممنوع:
- تشخيص أي حالة
- ادعاء رفع الذكاء
- كلمات مبالغ فيها
18.4 JSON Structures
Session Schema
json
{
  "schema_version": 1,
  "client_session_id": "uuid",
  "game_id": "seq-mem",
  "domain_id": "memory",
  "mode": "classic",
  "seed": "hex",
  "ticket_id": null,
  "started_at": "ISO",
  "ended_at": "ISO",
  "game_version": "1.0.0",
  "scoring_version": 1,
  "trials": [],
  "config": {},
  "client_meta": {},
  "source": "live"
}
19 — معرفة من المحادثات
19.1 تفضيلات المستخدم
اللغة: مصري + technical English مختلط

التنسيق: جداول + emojis + markdown منظم

الملفات: FULL files only — never partial, never diffs, never Ctrl+H

التسمية: Name + Path + Type قبل كل code block

لعبة واحدة: ممنوع خلط لعبتين في رسالة

Phase discipline: اختبار بعد كل phase

الإشارات: "اللي بعدو" = Next، "تمم" = Done، "كمّل" = Continue، "صلح" = Fix

مفيش استعجال — يفضل الجودة على السرعة

19.2 متطلبات المستخدم
مشروع حقيقي (مش toy)

قواعد صريحة:

No frameworks

No build step

No TypeScript (frontend)

Full files only

One game at a time

Script order sacred

19.3 المرفوضات الصريحة
❌ أي framework

❌ أي build step

❌ TypeScript في الفرونت

❌ Partial files

❌ Ctrl+H instructions

❌ Modifying flash-data.js بدون سبب واضح

❌ Skipping phases

❌ Per-game settings

19.4 قرارات لفظية
"معنديش مانع" = okay to take time

"مش مهم" = prioritize quality

"اديني البرومت" = user wants prompts not code

"أنا مش عايز..." = strong rejection

19.5 سياق مهم
المستخدم "Vibe Coder" — يفهم لكن لا يكتب كود

Trust level عالي

Testing يدوي في المتصفح

بياخد screenshots للمشاكل

يفضل الأسئلة المحددة على الطويلة

عايز AI حقيقي (مش شات بوت بسيط)

المشروع ده رأس مال — هيجيبه لمستثمر

19.6 تفضيلات التصميم
مفيش emojis في UI

Serious tone

Scientific feel

مفيش gamification مبالغ

The Folio Hand = المرجع

19.7 تفضيلات التطوير
Server + Frontend منفصلين

Manual testing after each phase

لا framework

Screenshots for bugs

Console logs للـ debugging

19.8 أهداف المنتج
Free tier

Scientific

AI-powered

Bilingual (AR + EN)

Free hosting ($0)

Ready for investor demo

19.9 معلومات غير مكتوبة في الكود
تجربة المستخدم مع Antigravity كانت مخيبة (بطيء، مش دقيق)

Claude بيعمل 90% شغل صحيح لكن الـ prompts محتاجة precision

المستخدم بيحب التجريب السريع

عايز يخلص قبل ما يجيب مستثمر

بيدور على traction — 50-100 مستخدم أولي

19.10 أمور مؤكدة
المشروع حقيقي — مش toy

المستخدم بيدفع قيمة على الجودة

لا يمكن تغيير scripts order

postMessage مع 7 fields إلزامية

The 8-file pattern مقدس

i18n لازم على كل النصوص

20 — معلومات غير معروفة
20.1 UNKNOWN
[UNKNOWN] Contents of some backend check-*.ts files

[UNKNOWN] Exact status of frontend numerical/ domain

[UNKNOWN] Whether _template/ should be removed

[UNKNOWN] Whether templates in shared/templates/ should be updated

[UNKNOWN] Exact deployment target

[UNKNOWN] Database choice for future auth

[UNKNOWN] Whether user will use Gemini later

[UNKNOWN] Exact domain weights for AI recommendations

[UNKNOWN] Detailed design for flash-ai.js

20.2 NOT VERIFIED
[NOT VERIFIED] Cross-browser compatibility

[NOT VERIFIED] Mobile responsiveness

[NOT VERIFIED] Performance benchmarks

[NOT VERIFIED] Security audit

[NOT VERIFIED] Accessibility audit

[NOT VERIFIED] Load testing

[NOT VERIFIED] Session data persistence across browsers

20.3 CONTENT NOT AVAILABLE
[CONTENT NOT AVAILABLE] Exact code of some old games (flanker, go-no-go)

[CONTENT NOT AVAILABLE] Full frontend dashboard code

[CONTENT NOT AVAILABLE] All 36 game.js files

[CONTENT NOT AVAILABLE] Exact content of docs/FLASH_HANDOFF_v3.md, v4.md

20.4 NEEDS CONFIRMATION
[NEEDS CONFIRMATION] Whether map-memory layout issue is fixed

[NEEDS CONFIRMATION] Whether face-match folder name is correct

[NEEDS CONFIRMATION] Whether all 36 games work in all 5 modes

[NEEDS CONFIRMATION] Whether user wants to use Gemini later

[NEEDS CONFIRMATION] Whether user wants Numerical domain

21 — تعليمات للـ AI الجديد
21.1 كيف تفهم المشروع
اقرأ كل ملفات PROJECT_HANDOFF/ بالترتيب

اقرأ ملفات docs/contracts/

افتح D:\Flash\frontend\dashboard\FLASH.html — الفرونت الرئيسي

افتح D:\Flash\backend\src\server.ts — الباك الرئيسي

اتفحص flash-data.js — كل الـ data

اتفحص لعبة كاملة (زي memory/seq-mem/) — 8-file pattern

اتفحص backend/src/services/ai/ — الـ AI

21.2 الملفات اللي لازم تقرأها أولاً
docs/PROJECT_HANDOFF/00_INDEX.md

docs/PROJECT_HANDOFF/01_PROJECT_OVERVIEW.md

docs/PROJECT_HANDOFF/14_CURRENT_STATE.md (في الملف ده — الجزء 14)

docs/PROJECT_HANDOFF/21_NEXT_AI_INSTRUCTIONS.md (الجزء الحالي)

docs/contracts/01_SESSION_SCHEMA.md

backend/src/server.ts

backend/src/services/ai/coach.ts

backend/src/services/difficulty/engine.ts

21.3 المعمارية التي يجب أن تحافظ عليها
The 8-file pattern — لا تغيّر

Script order — لا تغيّر

Storage schema flash:{game-id}:{type} — لا تغيّر

postMessage 7+4 fields — لا تحذف

Append-only facts — لا تغيّر

Idempotency — احتفظ

Model routing — احتفظ

Context compression للعربي — احتفظ

21.4 القرارات التي لا ترجع فيها
Vanilla JS (لا frameworks)

8 files per game

localStorage schema

postMessage protocol

Fastify (لا Express)

Neon PostgreSQL

Groq for AI

Model routing (AR/EN)

Append-only facts

The Folio Hand design

21.5 الأولوية الحالية
Backend Feature Completion:

Session Recap (POST /ai/recap) — 3 ساعات

Weekly Insights (GET /ai/insights) — 3 ساعات

21.6 المشاكل المعروفة
Antigravity CSS files missing

Access Denied on Antigravity folder

No auth yet

No sync yet

No tests yet

21.7 المفقود
3 CSS files for Antigravity

views/*.html for Antigravity

Session Recap

Weekly Insights

Auth

Sync

21.8 كيف تعدّل بأمان
اختبر قبل التعديل — تأكد إن الشيء يعمل حاليًا

احترم الـ contracts — لا تغيّر schemas

لا تعمل refactor بدون سبب

اختبر بعد كل تعديل

لو الشك، اسأل المستخدم

Full files only — لا partial

One game at a time

اذكر Name + Path + Type

21.9 قبل تعديل المعمارية
اقرأ الـ contract المناسب

اتفحص اللي depends on the component

اختبر النسخة الحالية

وضّح السبب للمستخدم

في حالة الشك — لا تعمل التعديل

21.10 الأسئلة التي يجب أن تسألها
"هذا التعديل هيكسر إيه؟"

"مين يعتمد على ده؟"

"فيه contract بيغطي ده؟"

"هو المستخدم عارف المخاطر؟"

"فيه طريقة أأمن؟"

21.11 قواعد التواصل مع المستخدم
مصري + technical English

جداول + emojis محدودة + markdown منظم

لا جargon بدون شرح

"اللي بعدو" = proceed

"تمم" = done + continue

"كمّل" = continue

"صلح" = fix

"فيه مشكلة" = will send screenshot

21.12 قواعد إرسال الملفات
FULL files فقط — لا snippets، لا diffs، لا Ctrl+H

اذكر: Name + Path + Type (new/modified)

لعبة واحدة في المرة

اختبر بعد كل phase

احترم script order

21.13 ما لا تفعله
❌ لا تفرض frameworks

❌ لا تستخدم TypeScript في الفرونت

❌ لا تضيف build step

❌ لا تغيّر script order

❌ لا تحذف postMessage fields

❌ لا تغيّر storage schema

❌ لا تعمل refactor بدون سبب

❌ لا تهمل اختبار

❌ لا تفترض

❌ لا تخترع معلومات

21.14 ما تفعله
✅ اقرأ كل الملفات قبل البدء

✅ احترم القرارات

✅ اختبر بعد كل تعديل

✅ اسأل عند الشك

✅ وثّق كل تعديل

✅ Full files فقط

✅ اذكر paths

✅ اختبر

21.15 Workflow المقترح
text
1. اقرأ الملفات
2. حدد المهمة
3. اتفحص الكود الحالي
4. اختبر الحالة الحالية
5. اعمل التعديل
6. اختبر التعديل
7. لو تمام → كمّل
8. لو مش تمام → حل
9. وثّق
10. اللي بعده
21.16 Kickoff Questions
قبل ما تبدأ أي مهمة جديدة، اسأل:

"إيه المهمة الحالية؟"

"إيه اللي المفروض يتغير؟"

"إيه اللي مش المفروض يتغير؟"

"إيه الأولوية؟"

21.17 المرجع السريع
حجم المشروع:

391 ملف

4.4 MB

107,467 سطر

36 لعبة

9 domains

17 endpoint

30 جدول DB

540 مستوى Atlas

اللغات:

Arabic → allam-2-7b

English → gpt-oss-120b

المسارات الرئيسية:

D:\Flash\backend\ — Backend

D:\Flash\frontend\ — Frontend قديم

D:\Flash\docs\ — Documentation

D:\flash-cognitive-studio\ — Antigravity (جديد)

المستثمر:

الهدف: Demo يعمل end-to-end

First users: 50-100

Launch: after MVP complete

الـ Magic Numbers:

36 games

9 domains

15 levels/game

540 total levels

3 sessions/day

6 minutes/day

🎯 نهاية التوثيق
تم توثيق كل ما نعرفه عن FLASH.
أي AI جديد يقدر يكمل المشروع من هنا بدون رجوع لأي سياق سابق.

النسخة: 1.0
التاريخ: 2026-10-07