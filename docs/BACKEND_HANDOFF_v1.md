$content = @'
# FLASH Backend — Handoff & Session Log v1.0

**التاريخ:** 2026-10-07
**الهدف:** مرجع كامل لأي AI هيشتغل على الـ Backend بعد كده
**المرجع السابق:** `docs/PROJECT_HANDOFF/` (00 → 21)

---

## ⚡ ملخص سريع

| المقياس | القيمة |
|---------|--------|
| **Endpoints** | 22 (كان 17 قبل الجلسة) |
| **جداول DB** | 40 (كان 30) |
| **AI Services** | 10 (كان 7) |
| **AI Providers** | 3 (Groq + OpenRouter + Gemini) |
| **Migrations** | 8 (001 → 008) |

---

## 1. BEFORE — حالة الـ Backend قبل الجلسة

كان مبني وشغال بـ:

**Stack:** Fastify 5 + TypeScript 5.6 + Neon PostgreSQL 17 + Zod 3.23

**ما كان موجود:**
- ✅ Session ingestion (`POST /sessions`) + PB + badges + adaptive engine
- ✅ AI Content Generation (`POST /ai/generate`) — 36 games
- ✅ Adaptive Difficulty Engine — 540 levels في `difficulty_configs`
- ✅ Session Planner (`GET /plan`) — Daily Ritual (rule-based)
- ✅ AI Coach Chat (`POST /ai/chat`) — AR: allam-2-7b | EN: gpt-oss-120b
- ✅ Conversation persistence
- ✅ Rule-based recommendations
- ✅ Idempotency على `client_session_id`
- ✅ 30 DB tables + 7 migrations
- ✅ 17 endpoints

**Endpoints الأصلية:**
GET /health
GET /domains
GET /games
GET /plan
GET /profile
GET /ability
GET /next/:gameId
GET /decisions
GET /sessions
POST /sessions
GET /ai/status
POST /ai/generate
POST /ai/chat
GET /ai/conversations
GET /ai/conversations/:id

text

---

## 2. AFTER — ما تم بناؤه في هذه الجلسة

### Sprint 1 — AI Features (يوم واحد)

| # | الميزة | Endpoint | الحالة |
|---|--------|----------|:---:|
| 1.1 | Session Recap | `POST /ai/recap` | ✅ |
| 1.2 | Weekly Insights | `GET /ai/insights` | ✅ |
| 1.3 | Content Validator | (integrated) | ✅ |

#### 1.1 Session Recap
- **الفكرة:** بعد كل جلسة، LLM يكتب تحليل نصي
- **الـ Flow:** load facts → build fact sheet → Groq → validate → fallback
- **القاعدة:** LLM phrases facts, لا يخترعها
- **الملفات:**
  - `src/services/ai/recap.ts` (5.3 KB)
  - `src/services/ai/prompts-recap.ts` (3.9 KB)
  - `src/routes/ai.ts` (عدّل)

#### 1.2 Weekly Insights
- **الفكرة:** فكرة واحدة + خطوة واحدة تالية
- **الـ Flow:** load 7-day facts → compare to previous week → Groq → validate → fallback
- **ملاحظة:** بيرجّع `source: "no_data"` لو مفيش sessions
- **الملفات:**
  - `src/services/ai/insights.ts` (11 KB)
  - `src/services/ai/prompts-insights.ts` (6 KB)
  - `src/routes/ai.ts` (عدّل)

#### 1.3 Content Validator
- **الفكرة:** طبقة حماية على **كل** LLM output
- **الفحوصات:**
  1. **L4 filter** — يمنع: ADHD / IQ / تشخيص / علاج / التوحد...
  2. **Hype filter** — يمنع: "miracle" / "genius" / "boost your brain" / "عبقري"
  3. **Shape validator** — JSON ناقص fields
  4. **Echo detector** — LLM كرر fact sheet بصيغة `key: value`
  5. **Header stripper** — يشيل section headers زي "الخطوة التالية:"
- **الملفات:**
  - `src/services/ai/validator.ts` (5.6 KB)
  - `src/services/ai/generate.ts` (مدمج)

### Sprint 1.5 — Multi-Provider Router (يوم واحد)

| المكوّن | الحالة |
|---------|:---:|
| `providers/types.ts` | ✅ |
| `providers/groq-provider.ts` | ✅ |
| `providers/openrouter-provider.ts` | ✅ |
| `providers/gemini-provider.ts` | ✅ |
| `health.ts` (Circuit Breaker) | ✅ |
| `router.ts` (الموزّع) | ✅ |

**الفكرة:** لو Groq وقع، يروح OpenRouter → Gemini → Rule fallback

**Circuit Breaker:**
- كل provider بيسجل نجاح/فشل
- 3 فشل متتالية → cooldown 60 ثانية
- بعدها يتخطاه ويستخدم اللي بعده

**Provider Order:** `groq → openrouter → gemini`

### Feature 1 — In-Game Micro-Coach

| # | المكوّن | الملف |
|---|---------|-------|
| 1 | Endpoint | `src/routes/ai-coach.ts` |
| 2 | Service | `src/services/ai/nudge.ts` (5.5 KB) |
| 3 | Prompts | `src/services/ai/prompts-nudge.ts` (3.5 KB) |
| 4 | Migration | `src/migrations/008_ai_extended.sql` |

**الفكرة:** الـ frontend يبعت آخر 5 trials → يرجع جملة قصيرة (2-12 كلمة)

**Triggers المدعومة:**
- `slow_down` — الإيقاع بطيء
- `speed_up` — الدقة عالية
- `tired` — قعدت فترة طويلة
- `focus` — 3 أخطاء متتالية
- `streak_break` — السلسلة انقطعت
- `great_run` — إيقاع ثابت

**Caching:** `nudge_cache` table بـ `pattern_hash` (Bucketed: acc/10, rt/100, duration/60s)

**Fallback:** كل trigger له رسالة جاهزة EN + AR

**Latency:** ~2.5s (مع Groq gpt-oss-120b) — مقبول حالياً، ينحسّن لاحقاً

---

## 3. Endpoints الكاملة (22)

### Core
| # | Method | Path | الوصف |
|---|--------|------|-------|
| 1 | GET | `/health` | حالة السيرفر + DB |
| 2 | GET | `/domains` | 9 domains |
| 3 | GET | `/games` | 36 لعبة |
| 4 | GET | `/plan` | Daily Ritual (rule-based) |
| 5 | GET | `/profile` | بروفايل + recs |
| 6 | GET | `/ability` | قدرة المستخدم |
| 7 | GET | `/next/:gameId` | المستوى القادم |
| 8 | GET | `/decisions` | قرارات المحرك |
| 9 | GET | `/sessions` | آخر 30 جلسة |
| 10 | POST | `/sessions` | ingest كامل |

### AI (13 endpoints)
| # | Method | Path | الوصف |
|---|--------|------|-------|
| 11 | GET | `/ai/status` | حالة AI |
| 12 | POST | `/ai/generate` | توليد محتوى |
| 13 | POST | `/ai/chat` | AI Coach Chat |
| 14 | GET | `/ai/conversations` | المحادثات |
| 15 | GET | `/ai/conversations/:id` | رسائل محادثة |
| 16 | **POST** | **`/ai/recap`** | **🆕 تحليل جلسة** |
| 17 | **GET** | **`/ai/insights`** | **🆕 ملخص أسبوعي** |
| 18 | **GET** | **`/ai/daily-plan`** | **🆕 خطة يومية بالـ AI** |
| 19 | **POST** | **`/ai/nudge`** | **🆕 مدرب لحظي** |
| 20 | 🆕 GET | `/ai/health` | (pending — Sprint 1.6) |

---

## 4. File Structure المُحدَّث
backend/src/
├── config/
│ ├── env.ts (added: GROQ_MODEL_FAST)
│ └── db.ts
├── migrations/
│ ├── 001_identity.sql
│ ├── 002_catalog.sql
│ ├── 003_facts.sql
│ ├── 004_derived.sql
│ ├── 005_ai.sql
│ ├── 006_difficulty.sql
│ ├── 007_ai_coach.sql
│ └── 008_ai_extended.sql 🆕 (10 tables)
├── routes/
│ ├── ai.ts ✏️ (+recap, +insights, +daily-plan)
│ ├── ai-coach.ts 🆕 (nudge)
│ ├── games.ts
│ ├── health.ts
│ ├── next.ts
│ ├── plan.ts
│ ├── profile.ts
│ └── sessions.ts
├── services/
│ ├── ai/
│ │ ├── groq-client.ts (legacy — موجود)
│ │ ├── gemini-client.ts (legacy — موجود)
│ │ ├── coach.ts ✏️ يستخدم groq مباشرة (pending: router)
│ │ ├── context.ts ✅ موجود
│ │ ├── generate.ts ✏️ + validator مدمج
│ │ ├── prompts.ts ✅ موجود
│ │ ├── prompts-base.ts ✅ موجود
│ │ ├── prompts-extended.ts ✅ موجود
│ │ ├── recap.ts 🆕
│ │ ├── prompts-recap.ts 🆕
│ │ ├── insights.ts 🆕
│ │ ├── prompts-insights.ts 🆕
│ │ ├── daily-plan.ts 🆕
│ │ ├── prompts-daily-plan.ts 🆕
│ │ ├── validator.ts 🆕
│ │ ├── nudge.ts 🆕
│ │ ├── prompts-nudge.ts 🆕
│ │ ├── health.ts 🆕 (Circuit breaker)
│ │ ├── router.ts 🆕 (Multi-provider)
│ │ └── providers/
│ │ ├── types.ts 🆕
│ │ ├── groq-provider.ts 🆕
│ │ ├── openrouter-provider.ts 🆕
│ │ ├── gemini-provider.ts 🆕
│ │ └── index.ts 🆕
│ ├── difficulty/
│ ├── derive.ts
│ ├── pb.ts
│ ├── planner.ts
│ ├── recommendations.ts
│ ├── badges.ts
│ └── users.ts
├── schemas/
├── migrate.ts
├── seed.ts
└── server.ts ✏️ (+aiCoachRoutes)

docs/
└── BACKEND_HANDOFF_v1.md 🆕 (هذا الملف)

text

---

## 5. Database Tables (40)

### Identity (2)
`users`, `devices`

### Catalog (5)
`domains`, `games`, `game_domain_weights`, `badges`, `norms`

### Facts (2)
`sessions`, `session_trials`

### Derived (4)
`personal_bests`, `user_game_stats`, `domain_scores`, `user_badges`

### Sync + Ops (6)
`user_sync_state`, `user_settings`, `play_tickets`, `integrity_events`, `import_batches`, `_migrations`

### AI (16)
`user_cognitive_profile`, `ai_recommendation_log`, `adaptive_difficulty_state`, `generated_content_cache`, `ai_conversations`, `ai_messages`

### Difficulty (3)
`difficulty_configs` (540 rows), `player_game_ability`, `engine_decisions`

### Extended (10) 🆕 — Migration 008
`nudge_cache`, `cognitive_fingerprints`, `game_variants`, `predictions`, `journal_entries`, `lab_experiments`, `micro_lessons`, `director_sessions`, `voice_requests`, `transfer_signals`, `error_patterns`

---

## 6. Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://...

# Auth
AUTH_SECRET=...
AUTH_URL=http://localhost:3000

# AI — Groq (primary)
GROQ_API_KEY=gsk_...
GROQ_MODEL_EN=openai/gpt-oss-120b
GROQ_MODEL_AR=allam-2-7b
GROQ_MODEL_FAST=openai/gpt-oss-20b    🆕

# AI — Gemini (fallback)
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash

# AI — OpenRouter (fallback)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free

# Email
RESEND_API_KEY=...
EMAIL_FROM=FLASH <noreply@flash.app>

# Frontend
CORS_ORIGIN=http://localhost:5173,https://flash.pages.dev
7. القواعد الذهبية (Golden Rules)
7.1 Evidence Ladder — docs/06_PLAYER_INTELLIGENCE.md
Level	النوع	مسموح؟
L0	Observed	✅
L1	Derived	✅
L2	Estimated	✅ (مع confidence)
L3	Hypothesized	✅ (بعد ≥5 sessions)
L4	Clinical claims	🚫 PROHIBITED AT EVERY LAYER
L4 Forbidden: ADHD / IQ / depression / autism / diagnosis / therapy / cure / "brain age" / أي كلمة طبية أو تشخيصية

7.2 AI Rules
✅ LLM phrases insights; it does NOT invent them

✅ كل LLM output يمر على validator.ts قبل الإرجاع

✅ Model Routing: AR → allam-2-7b | EN → gpt-oss-120b

✅ كل AI بيمر على router.ts (multi-provider failover)

❌ ممنوع hype words / exclamation marks / emojis في النصوص

❌ ممنوع مقارنة المستخدم بالآخرين — فقط بخطه الأساسي

7.3 Code Rules
✅ Fastify 5 + TypeScript strict + Zod

✅ ESM imports (.js suffix)

✅ await fastify.register(...) — كل route

✅ UTF8Encoding $false في PowerShell لملفات فيها عربي

❌ مفيش تغيير للـ contracts (docs/contracts/)

❌ مفيش touch للـ frontend

7.4 Idempotency
sessions = immutable fact

(user_id, client_session_id) = unique key

Resend = {status: "already_accepted"}

8. المتبقي (Pending)
Sprint 1.6 — تحويل باقي AI services للـ router
□ coach.ts → router
□ generate.ts → router
□ recap.ts → router
□ insights.ts → router
□ daily-plan.ts → router
□ POST /ai/nudge → تحسين latency (< 800ms)
Sprint 1.7 — AI Health Endpoint
□ GET /ai/health — يعرض حالة كل provider + fallback chain
Sprint 2 — Features 2-12 (12 ميزة)
□ #2 Cognitive Fingerprint
□ #3 Dynamic Game Variants
□ #4 Predictive Coach
□ #5 AI Journal (opt-in)
□ #6 Voice-First
□ #7 AI Lab
□ #8 Director Mode
□ #10 Micro-Lessons
□ #11 Error Pattern Analysis
□ #12 Transfer Tracker
Sprint 3 — Auth
□ Better Auth setup
□ Signup / Login / Logout / Me
□ Email verification (Resend)
□ استبدال getOrCreateDemoUser() بـ request.auth.user
Sprint 4 — Sync
□ POST /sync (push + pull + cursor)
□ POST /sync/import (guest migration)
□ change_seq + tombstones
Sprint 5 — Polish
□ Golden fixture tests (test/fixtures/)
□ Pino correlation IDs + latency histograms
□ Centralized error handling
□ Dockerfile for Render
□ .env.example كامل
9. اختبارات سريعة (Test Commands)
Health
powershell
Invoke-RestMethod http://localhost:3000/health
Session ingest
powershell
$body = @{
  schema_version = 1
  client_session_id = [guid]::NewGuid().ToString()
  game_id = "seq-mem"
  domain_id = "memory"
  mode = "classic"
  seed = "test1234abcd5678"
  started_at = (Get-Date).AddMinutes(-2).ToUniversalTime().ToString("o")
  ended_at = (Get-Date).ToUniversalTime().ToString("o")
  game_version = "1.0.0"
  scoring_version = 1
  trials = @(
    @{ index=0; rt_ms=2000; correct=$true; is_practice=$false; stimulus=@{}; response=@{} }
  )
  config = @{ max_lives=3 }
  client_meta = @{ user_agent="PS"; viewport=@{w=1920;h=1080}; device_id="test"; device_clock_skew_ms=$null }
  source = "live"
} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri 'http://localhost:3000/sessions' -Method Post -Body $body -ContentType 'application/json'
AI Recap
powershell
$sid = (Invoke-RestMethod http://localhost:3000/sessions).sessions[0].id
$body = @{ session_id = $sid; language = "ar" } | ConvertTo-Json
[System.IO.File]::WriteAllText("$env:TEMP\recap.json", $body, [System.Text.UTF8Encoding]::new($false))
Invoke-RestMethod -Uri 'http://localhost:3000/ai/recap' -Method Post -InFile "$env:TEMP\recap.json" -ContentType 'application/json; charset=utf-8'
AI Insights
powershell
Invoke-RestMethod 'http://localhost:3000/ai/insights?language=ar'
Invoke-RestMethod 'http://localhost:3000/ai/insights?language=en'
AI Daily Plan
powershell
Invoke-RestMethod 'http://localhost:3000/ai/daily-plan?language=ar'
AI Nudge
powershell
$body = @{
  trigger = "great_run"
  game_id = "flanker"
  game_name = "Flanker Test"
  recent_accuracy = 96
  recent_median_rt_ms = 780
  baseline_accuracy = 90
  baseline_rt_ms = 850
  consecutive_mistakes = 0
  session_duration_ms = 150000
  trials_count = 10
  language = "en"
} | ConvertTo-Json
[System.IO.File]::WriteAllText("$env:TEMP\nudge.json", $body, [System.Text.UTF8Encoding]::new($false))
Invoke-RestMethod -Uri 'http://localhost:3000/ai/nudge' -Method Post -InFile "$env:TEMP\nudge.json" -ContentType 'application/json; charset=utf-8'
10. Common Commands
powershell
# Development
cd D:\Flash\backend
npm run dev

# Migration
npm run migrate

# Seed
npm run seed
npm run seed:atlas

# Type check
npx tsc --noEmit

# Kill all node
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
11. Known Issues
#	المشكلة	الحالة
1	nudge.ts latency ~2.5s (طويل)	🟡 يحتاج تحسين (use OpenRouter llama فaster)
2	Gemini keys غير مأكدين إنها تشتغل	🟡 يحتاج اختبار
3	coach.ts + generate.ts لسه على groq مباشر (مش router)	🟡 Sprint 1.6
4	No /ai/health endpoint	🟡 Sprint 1.7
5	AR reasons أحياناً generic (allam-2-7b)	🟢 مقبول
6	No tests yet	🟡 Sprint 5
12. References
Handoff الأصلي: docs/PROJECT_HANDOFF/ (00 → 21)

Contracts: docs/contracts/01_SESSION_SCHEMA.md → 04_GAME_CATALOG.md

Player Intelligence: docs/06_PLAYER_INTELLIGENCE.md

AI & Adaptive Engine: docs/07_AI_AND_ADAPTIVE_ENGINE.md

Strategies: docs/STRATEGY_AND_ARCHITECTURE.md

13. تعليمات للـ AI الجديد
قبل ما تبدأ:

اقرأ الملف ده كامل

اقرأ docs/PROJECT_HANDOFF/00_INDEX.md

اقرأ docs/contracts/01_SESSION_SCHEMA.md + 04_GAME_CATALOG.md

بص على docs/06_PLAYER_INTELLIGENCE.md (Evidence Ladder)

بص على backend/src/server.ts + backend/src/services/ai/router.ts

قواعدك:

✅ Full files فقط — مفيش partial/diffs

✅ Name + Path + Type قبل كل code block

✅ Arabic text في PowerShell: UTF8Encoding $false

✅ Migration جديدة: أضف رقم جديد (009_...)، متعدّلش القديمة

✅ اختبر كل endpoint قبل ما تقول "تمم"

❌ متعدّلش الـ contracts

❌ متـلـمسش الـ frontend

❌ متخترعش L4 claims

الأولوية القادمة:

تحويل باقي AI services للـ router (coach.ts, generate.ts, recap.ts, insights.ts, daily-plan.ts)

GET /ai/health endpoint

Feature 2 (Cognitive Fingerprint)

آخر تحديث: 2026-10-07
الإصدار: v1.0
Next AI: ابدأ من Sprint 1.6 في الملف ده
'@
j

$content = Get-Content $path -Raw -Encoding UTF8

$update = @'


---

## UPDATE LOG — Sprint 1.6 (2026-10-07)

### ✅ Multi-Provider Router — Done
- `router.ts` محدّث بـ language-aware model selection
- **كل AI services** اتحولوا للـ router: `coach.ts`, `generate.ts`, `recap.ts`, `insights.ts`, `daily-plan.ts`, `nudge.ts`
- كل response دلوقتي بيرجّع `provider` + `model` + `fallback_chain`
- `GET /ai/health` endpoint جديد — يعرض حالة كل provider + health metrics
- **Bug fix:** `health` endpoint كان بيرجّع `ok: False` لما مفيش calls — اتصلح

### Endpoints الآن: 23 (كان 22)

### الحالة الحقيقية بعد Sprint 1.6:
- ✅ Groq: شغال (checked)
- ✅ OpenRouter: enabled (لم يُختبر بعد)
- ✅ Gemini: enabled (لم يُختبر بعد)
- ✅ Circuit breaker active
- ✅ كل الردود تحتوي `provider` field

### المتبقي:
- Sprint 1.7 (تم ضمّها في 1.6)
- Feature 2 — Cognitive Fingerprint ← التالي
'@

$content = $content + $update

$enc = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($path, $content, $enc)

$size = (Get-Item $path).Length
Write-Host "OK Handoff updated ($size bytes)" -ForegroundColor Green
🚀 Feature 2 — Cognitive Fingerprint
🎯 الفكرة
بعد 20+ session، الـ AI يحلل نمط المستخدم ويعطيه بصمة معرفية:

Archetype واحد (مثلاً "Sharp Shooter")

Traits بأرقام (Speed, Accuracy, Consistency)

Summary فقرة قصيرة

Confidence بناءً على عدد الـ sessions

🧠 المنطق — Rule-based Classification (مش LLM)
مبدأ مهم: التصنيف deterministic، والـ LLM بيصيغ بس.

مصفوفة الـ Archetypes
RT	Accuracy	Archetype
Fast	High	Sharp Shooter 🎯
Fast	Low	Impulsive ⚡
Slow	High	Methodical 🧭
Slow	Low	Cautious 🛡️
Mixed	High	Balanced ⚖️
Mixed	Low	Exploring 🔍
Modifiers (تضاف للـ traits)
Pattern	Modifier
Accuracy ↑ over time	learner
Accuracy flat 10+ sessions	plateaued
RT std dev high	variable
Domain std dev low	specialist
Domain std dev high	generalist