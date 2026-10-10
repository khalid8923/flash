# FLASH Backend — Handoff v4.1

**التاريخ:** 2026-10-09
**الإصدار:** v4.1 (Post Sprint 17 + Frontend Experiments)
**المرجع السابق:** `BACKEND_HANDOFF_v4.md`
**الحالة:** Backend Phase A مكتمل · Frontend design experiments جارية

---

## 0. ملخص في 3 سطور

> Backend كامل (85 endpoint · 51 جدول · 23 migration · 0 TS errors).  
> Frontend design experiments في `D:\Flash\motion-lab\` — بعضها عجب المستخدم، بعضها لأ.  
> القرار: Claude سيكمل الـ Cortex Reef (User + Admin + Game Shell) — Backend جاهز للربط.

---

## 1. Before vs After (v4 → v4.1)

| المقياس | v4 | v4.1 |
|---|---|---|
| Endpoints | 85 | 85 (مستقر) |
| DB Tables | 51 | 51 |
| Migrations | 23 | 23 |
| TS Errors | 0 | 0 |
| Golden Tests | 6/6 | 6/6 |
| Frontend Animations | 0 | 1 (Access Code) |
| Design Decisions | مفتوحة | Pink theme + Cortex Reef |

**الملفات اللي اتضافت في v4.1:**
- `frontend-design` skill (Claude Anthropic skill)
- `motion-lab/access-code.html` — Neuron Firing animation (✅ approved)
- `motion-lab/login.html` — Cognitive Awakening (⏳ pending approval)
- `motion-lab/logo.html` — Living Mark (❌ rejected — تم إرجاء logo)
- `motion-lab/dashboard.html` — Cortex Canvas prototype (❌ rejected — مش في مستوى Claude)
- `motion-lab/shared/logo.js` — Shared logo component (⏳ pending)

---

## 2. حالة الـ Backend (v4.1 = نفس v4)

### 2.1 Endpoints (85)

**Core (10):**
GET /health, /ready, /domains, /games, /plan, /profile,
/ability, /next/:gameId, /decisions, /sessions
POST /sessions

text

**Player Auth (4):**
POST /auth/otp/request { email }
POST /auth/otp/verify { email, code }
GET /auth/me
POST /auth/logout

text

**Plays (2):**
POST /plays { game_id, mode }
POST /plays/consume { token }

text

**Player /me (2):**
GET /me/export
POST /me/erase { confirm: "DELETE" }

text

**Sync (2):**
GET /sync/changes?cursor=N
GET /sync/state

text

**AI Core (9):**
GET /ai/status, /ai/conversations, /ai/conversations/:id,
/ai/insights, /ai/daily-plan, /ai/health
POST /ai/generate, /ai/chat, /ai/recap

text

**AI Features (21):**
POST /ai/nudge
GET /ai/fingerprint, POST /ai/fingerprint/regenerate
GET /ai/variants/game/:gameId, /ai/variants/generate/:gameId,
/ai/variants/:variantId, POST /ai/variants/regenerate
GET /ai/predictions, /ai/predictions/history
POST /ai/journal/entry, GET /ai/journal/today, /ai/journal/today/entry,
/ai/journal/history, DELETE /ai/journal/today
GET /ai/voice/status, POST /ai/voice/chat
POST /ai/lab/start, /ai/lab/complete, DELETE /ai/lab/abandon,
GET /ai/lab/suggestions, /ai/lab/current, /ai/lab/history
POST /ai/director/start, /ai/director/:id/checkpoint, /ai/director/:id/end,
GET /ai/director/:id
GET /ai/lessons/topics, /ai/lessons, /ai/lessons/:topic,
POST /ai/lessons/regenerate
GET /ai/error-patterns, /ai/transfer-tracker

text

**Admin Auth (8):**
POST /admin/auth/login, /admin/auth/logout,
/admin/admins/invite, /admin/admins/:id/revoke
GET /admin/auth/me, /admin/admins, /admin/audit, /admin/audit/verify

text

**Admin AI (4):**
GET /admin/ai/health, /admin/ai/providers, /admin/ai/pool, /admin/ai/budget

text

**Admin Catalog (10):**
GET /admin/catalog, /admin/catalog/drift, /admin/catalog/:id,
/admin/catalog/games, /admin/catalog/games/:id,
/admin/registry/trial-stats
POST /admin/catalog/sync, /admin/catalog/:id/disable, /admin/catalog/:id/enable

text

**Admin Difficulty (2):**
GET /admin/difficulty/:gameId, /admin/difficulty/calibration

text

**Admin Integrity (3):**
GET /admin/integrity/queue, /admin/integrity/sessions/:id
POST /admin/integrity/sessions/:id/review

text

**Admin Norms (4):**
GET /admin/norms, /admin/norms/candidates, /admin/norms/percentile
POST /admin/norms/publish

text

**Admin Analytics (3):**
GET /admin/analytics/metrics, /admin/analytics/funnel, /admin/analytics/retention

text

**Admin Flags (3):**
GET /admin/flags, /flags/eval
POST /admin/flags/:key

text

**Admin Privacy (2):**
GET /admin/privacy/inventory, /admin/privacy/processors

text

**Admin Demo (7):**
GET /admin/demo/origins, /admin/demo/scripts
POST /admin/demo/users/:id/origin, /admin/demo/generate, /admin/demo/reset,
/admin/demo/scripts, /admin/demo/scripts/reset

text

**Admin Jobs (2):**
GET /admin/jobs
POST /admin/jobs/enqueue

text

**Admin Retention (3):**
GET /admin/retention/rules, /admin/retention/preview
POST /admin/retention/run

text

**Admin Console + Platform (3):**
GET /admin/console, /admin/platform/health, /admin/platform/ping

text

---

## 3. Migrations (23) — لا تُعدّل

| # | File | Sprint |
|---|---|---|
| 001-011 | (from v3) | — |
| 012 | migration_checksums.sql | 1 |
| 013 | admin_bootstrap.sql | 2 |
| 014 | player_auth.sql | 3 |
| 015 | tickets_v2.sql | 4 |
| 016 | fix_play_tickets.sql | 4 |
| 017 | session_reviews.sql | 8 |
| 018 | norms_pipeline.sql | 9 |
| 019 | metric_daily.sql | 9 |
| 020 | feature_flags.sql | 10 |
| 021 | ai_usage.sql | 11 |
| 022 | job_runs.sql | 12/13 |
| 023 | privacy_requests.sql | 16 |

**القاعدة:** migrations 001-023 **مقفولة**. أي إضافة = رقم جديد (024+).

---

## 4. Environment Variables

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info

DATABASE_URL=postgresql://...

AUTH_SECRET=... (64-char hex)
AUTH_URL=http://localhost:3000
ADMIN_TOKEN=... (24-char hex)

BACKUP_KEY=... (32-byte base64)
BACKUP_DIR=./backups
BACKUP_KEEP_LAST=7

GROQ_API_KEY=gsk_...
GROQ_MODEL_EN=openai/gpt-oss-120b
GROQ_MODEL_AR=allam-2-7b
GROQ_MODEL_FAST=openai/gpt-oss-20b

OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free

GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash

VOICE_MODEL=whisper-large-v3-turbo
VOICE_MAX_BYTES=10485760

RESEND_API_KEY=...
EMAIL_FROM=FLASH <noreply@flash.app>

CORS_ORIGIN=http://localhost:5173,http://localhost:8080
5. الأوامر السريعة
powershell
# Development
cd D:\Flash\backend
npm run dev

# Migrations
npm run migrate

# Seed
npm run seed
npm run seed:atlas

# Catalog sync
npm run catalog:sync

# Golden tests
npm run test:golden

# Admin setup (first owner)
npm run admin:setup -- owner@example.com "Name"

# Backups
npm run backup

# TypeScript check
npx tsc --noEmit

# Full verifier
powershell -ExecutionPolicy Bypass -File verify.ps1

# Kill node
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
6. Test Suite
File	Purpose	Last Result
test.ps1	Master (12 checks)	ALL PASS
test-security.ps1	Security headers	7/7
test-health.ps1	/health + /ready	PASS
test-catalog.ps1	ETag + 304	PASS
test-rate-limit.ps1	X-RateLimit	PARTIAL
test-r05.mjs	Concurrency	PASS
scripts/golden-tests.ts	6 deterministic	6/6
7. Known Issues
#	Issue	Priority	Status
1	Rate limit 429 unstable	Med	Partial
2	nudge latency ~2.5s	Med	Deferred
3	Player endpoints use demo user fallback	Low	By design
4	Sync pull-only	Low	Sprint 18
5	Deployment config	Med	Ready to run
8. Roadmap المتبقي
Sprint	Focus	الوقت
18	Frontend integration (ربط Dashboard بـ Backend)	4-6h
19	Deploy to Render + Cloudflare	2h
20	5 games تكملة (seq-mem, argument-analyzer, ...)	6h
21	Auth V3 (Passkey/TOTP)	1 أسبوع
22	Sync protocol (full pull + push)	1 أسبوع
9. Integration Points
اللي الـ Frontend محتاج يعمله (بعد Claude):

#	الحاجة	الـ Endpoint
1	User auth (OTP)	/auth/otp/request + /auth/otp/verify
2	Dashboard data	GET /profile + GET /plan + GET /sessions
3	Session submission	POST /sessions (from game shell)
4	AI Coach	POST /ai/chat
5	AI Fingerprint	GET /ai/fingerprint
6	AI Predictions	GET /ai/predictions
7	Journal	POST /ai/journal/entry
8	Micro-Lessons	GET /ai/lessons
9	Daily Plan	GET /ai/daily-plan
10	Error Patterns	GET /ai/error-patterns
11	Transfer Tracker	GET /ai/transfer-tracker
12	Nudge (in-game)	POST /ai/nudge
Base URL:

Dev: http://localhost:3000

Prod: https://flash-backend.onrender.com

Auth header: Authorization: Bearer ses_... (from OTP verify)

10. تعليمات للـ AI الجديد
اقرأ:

BACKEND_HANDOFF_v4.md (الأساس)

BACKEND_HANDOFF_v4.1.md (هذا الملف)

docs/contracts/01_SESSION_SCHEMA.md

docs/contracts/04_GAME_CATALOG.md

docs/06_PLAYER_INTELLIGENCE.md

القواعد:

Full files only

Migrations جديدة = رقم جديد (024+)

لا تلمس 001-023

UTF-8 no BOM

اختبر كل تغيير

Backend فقط — Frontend يديره Claude

User context:

مصري + Technical English

"اللي بعدو" = Next

"تمم" = Done

"كمّل" = Continue

آخر تحديث: 2026-10-09
Next AI: Sprint 18 (Frontend Integration) — بعد Claude ما يخلص الـ Dashboard

text

---

## 📁 الملف التاني: `FRONTEND_HANDOFF_v1.0.md`

**احفظه في:** `D:\Flash\docs\FRONTEND_HANDOFF_v1.0.md`

---

```markdown
# FLASH Frontend — Handoff v1.0

**التاريخ:** 2026-10-09
**الإصدار:** v1.0 (Initial documentation)
**الحالة:** 42 لعبة موجودة · Design experiments جارية · Integration pending

---

## 0. ملخص في 3 سطور

> Frontend مبني على **Vanilla HTML/CSS/JS** + **8-file pattern** لكل لعبة.  
> **42 لعبة** موجودة على الديسك (36 core + 6 bonus).  
> **Design v1.0 (Cortex Reef)** قيد الإنشاء — Pink theme + Motion system.

---

## 1. المبادئ المقدسة

| المبدأ | التفاصيل |
|---|---|
| **Vanilla فقط** | HTML + CSS + JS — مفيش frameworks |
| **No build step** | يشتغل من `file://` |
| **No TypeScript** | JS فقط في الفرونت |
| **No Tailwind** | CSS مكتوب يدوياً |
| **8-file pattern** | كل لعبة = 8 ملفات بالظبط |
| **Script order** | ترتيب تحميل الـ scripts مقدس |
| **Bilingual** | EN + AR + RTL في كل حاجة |
| **Scientific** | كل لعبة لها citation أكاديمي |

---

## 2. البنية الكاملة
D:\Flash\frontend
├── dashboard
│ ├── FLASH.html ← Entry point
│ ├── flash.css ~900 lines
│ └── js
│ ├── flash-data.js (domains + games + translations)
│ ├── flash-charts.js (canvas radar + neural bg)
│ └── flash-core.js (state + render + postMessage)
├── games
│ ├── attention\ (4 games)
│ ├── spatial\ (4 games)
│ ├── speed\ (4 games)
│ ├── memory\ (4 games + flash-cards)
│ ├── logic\ (4 games + truth-tbl)
│ ├── language\ (4 games)
│ ├── creativity\ (4 games)
│ ├── emotional\ (4 games)
│ ├── problem\ (4 games)
│ └── numerical\ (4 games — bonus)
└── shared
├── i18n.js (EN + AR + RTL)
├── settings.js (global settings + music)
├── flash-stages.js (8-stage system)
└── templates\ (legacy game templates)

text

---

## 3. الـ 8-file Pattern

**كل لعبة MUST تحتوي على:**
frontend/games/{domain}/{game-id}/
├── config.json ← Metadata (documentation only)
├── game.html ← HTML + 8 script tags
├── game.css ← ~500 خاص + ~450 مشترك
├── game.js ← Core logic (~900-1300 lines)
├── {game}-helpers.js ← Storage, PB, History, Badges, Missions
├── {game}-sounds.js ← Web Audio API synthesis
├── {game}-stages.js ← 8 progressive stages
└── {game}-extra-modes.js ← Speed, Endless, Precision, Daily

text

**⚠️ لا تغير الـ 8-file pattern أبداً.** Claude سيكمل الألعاب الناقصة بنفس الشكل.

---

## 4. Script Load Order (CRITICAL)

**في `game.html` — لا يُغيَّر أبداً:**

```html
<script src="../../../shared/i18n.js"></script>
<script src="../../../shared/settings.js"></script>
<script src="../../../shared/flash-stages.js"></script>
<script src="{game}-stages.js"></script>
<script src="{game}-helpers.js"></script>
<script src="{game}-sounds.js"></script>
<script src="{game}-extra-modes.js"></script>
<script src="game.js"></script>
السبب: كل ملف يعتمد على اللي قبله.

5. Shared Systems (3 ملفات أساسية)
5.1 shared/i18n.js
API:

javascript
FLASH_I18N.t(key, params)      // Translate
FLASH_I18N.setLang('en'|'ar')  // Change language
FLASH_I18N.getLang()           // Current language
FLASH_I18N.isRTL()             // Is Arabic?
FLASH_I18N.addStrings(lang, obj)
Storage: flash:lang

Event: flash:lang-changed

Coverage: 200+ translation keys

5.2 shared/settings.js
API:

javascript
FlashSettings.get(key)
FlashSettings.set(key, value)
FlashSettings.openPanel()
FlashSettings.onChange(key, cb)
FlashSettings.music.play() / pause() / toggle()
FlashSettings.applyToDOM()
Storage: flash:settings

Default settings:

theme: 'dark' | 'light'

reducedMotion: false

highContrast: false

soundEnabled: true

soundVolume: 0.7

musicEnabled: false

musicVolume: 0.4

haptics: true

inputMode: 'both' | 'keyboard' | 'touch'

5.3 shared/flash-stages.js
API:

javascript
FlashStages.init(gameId, stages, opts)
FlashStages.checkSession(payload)
FlashStages.getProgress()
FlashStages.renderStrip(container)
FlashStages.showToast(stage)
FlashStages.reset()
Storage: flash:stages:{gameId}

6. Storage Schema (localStorage)
text
flash:lang                    → 'en' | 'ar'
flash:settings                → { _v: 1, data: {...} }
flash:stages:{game-id}        → { completed: [...], updatedAt }
flash:{game-id}:pb            → { bestAccuracy, bestMedianRT, ... }
flash:{game-id}:history       → last 30 sessions
flash:{game-id}:daily         → 90 days log
flash:{game-id}:badges        → unlocked badges
flash:{game-id}:missions      → today's missions
القاعدة: دايماً flash:{game-id}:{type} format.

7. postMessage Protocol
عند نهاية أي session:

javascript
window.parent.postMessage({
  type: 'flash:game-complete',
  gameId: 'lexical-decision',
  domain: 'language',
  mode: 'classic',
  maxLevel: 15,
  accuracy: 87,
  score: 2450,
  medianRT: 620,
  rtv: 145,
  rcs: 12.4,
  isNewPB: true,
  ...gameSpecificMetrics
}, '*');
الـ 7 حقول الأساسية (إجبارية):

type

gameId

domain

mode

maxLevel

accuracy

score

الـ 4 حقول الإضافية (إجبارية):

medianRT

rtv

rcs

isNewPB

8. الـ 42 لعبة — الحالة الكاملة
Core Domains (36)
Domain	Games	Status
Attention	flanker, go-no-go, task-switching, vigilance	✅ 4/4
Spatial	mental-rotation, corsi-blocks, map-memory, block-counter	✅ 4/4
Speed	reaction, color-match, symbol-sprint, rapid-fire	✅ 4/4
Memory	n-back, face-match, pattern-recall, seq-mem	✅ 4/4
Logic	matrix-logic, syllogisms, deduction, argument-analyzer	🟡 3/4 (stages.js = 0 B)
Language	lexical-decision, vocabulary-elite, verbal-analogies, word-scramble	✅ 4/4
Creativity	alternative-uses, creative-connect, story-spark, idea-flow	✅ 4/4
Emotional	micro-expressions, tone-detector, empathy-engine, social-read	✅ 4/4
Problem	hanoi, river-crossing, gear-logic, path-finder	✅ 4/4
Bonus Games (6)
Game	Domain	Status
flash-cards	memory	🟡 4 files (not 8)
truth-tbl	logic	🟡 4 files
digit-span	numerical	🟡 4 files
mental-math	numerical	🟡 4 files
num-chains	numerical	🟡 4 files
speed-calc	numerical	🟡 4 files
⚠️ الـ 6 bonus games ناقصين 4 ملفات كل واحد (helpers, sounds, stages, extra-modes).

9. Design System v1.0 — "Cortex Reef"
اتفق عليه:

الألوان
اللون	الكود	الاستخدام
Vellum	#F7F5F0	الخلفية الأساسية
Ink	#1E2230	النصوص والبيانات
Pink	#F48FB1	الإشارة النشطة (بدل Gold)
Pink Mid	#E91E63	التأكيد والتمييز
Pink Deep	#AD1457	العمق
Cyan	#00E5FF	حضور الـ AI
Ink Soft	#6E7078	النص الثانوي
Ink Faint	#B8B5AD	العناصر الخاملة
9 ألوان للـ Domains
Domain	Color
attention	#F48FB1
memory	#B388FF
speed	#FFB74D
flex	#4DD0E1
inhibit	#EF5350
reason	#64B5F6
spatial	#FF8A65
language	#F06292
planning	#26A69A
الخطوط
الدور	الخط
Display	Iowan Old Style / Fraunces
UI	System UI
Mono	JetBrains Mono
Arabic Display	Amiri / Noto Naskh
Arabic UI	Tajawal / IBM Plex Sans Arabic
10. Motion System v1.0 — 5 مصطلحات
المصطلح	المعنى	الاستخدام
Firing	إشارة تنطلق من نقطة	عند input
Converging	جزيئات تتجمع	عند submit
Calibrating	تذبذب يستقر	عند loading
Decaying	إشارة تتفكك	عند exit
Awakening	ضوء ينتشر	عند entry
الملفات اللي اتعملت:

motion-lab/access-code.html — Neuron Firing (✅ approved)

motion-lab/login.html — Cognitive Awakening (⏳ pending)

motion-lab/logo.html — Living Mark (❌ rejected — مؤجل)

motion-lab/dashboard.html — Cortex Canvas prototype (❌ rejected)

motion-lab/shared/logo.js — Shared logo component (⏳ pending)

11. الأدوار والمسؤوليات
Claude (AI Studio)
User Dashboard — Cortex Reef design

Admin Dashboard — نفس اللغة البصرية

Game Shell — wrapper للألعاب

Motion choreography — كل الـ animations

DeepSeek (أنا)
Backend integration — ربط الفرونت بالـ 85 endpoint

Data flow — من الـ API للـ UI

Debugging — عند الأخطاء

Architecture — القرارات الهيكلية

Antigravity
Prototype — تجارب سريعة (اختياري)

12. Integration Points مع Backend
الـ endpoints اللي الفرونت محتاجها:

Feature	Endpoint
Player auth	POST /auth/otp/request + /verify
Dashboard data	GET /profile + /plan + /sessions
Session submit	POST /sessions
AI Coach	POST /ai/chat
Fingerprint	GET /ai/fingerprint
Predictions	GET /ai/predictions
Journal	POST /ai/journal/entry
Lessons	GET /ai/lessons
Daily Plan	GET /ai/daily-plan
Error Patterns	GET /ai/error-patterns
Transfer	GET /ai/transfer-tracker
Nudge	POST /ai/nudge
Base URL:

Dev: http://localhost:3000

Prod: https://flash-backend.onrender.com

Auth: Authorization: Bearer ses_...

13. المتبقي (Roadmap)
Phase 1 — Claude يكمل الـ Design
#	الحاجة	الوقت
1	User Dashboard (Cortex Reef)	~4h
2	Admin Dashboard	~4h
3	Game Shell	~2h
4	Login + Verify + Logout animations	~2h
Phase 2 — Backend Integration
#	الحاجة	الوقت
1	API Client (api.js)	2h
2	Auth flow (OTP → session)	3h
3	Dashboard data loading	2h
4	Game → Session submission	2h
5	AI features integration	4h
Phase 3 — Completion
#	الحاجة	الوقت
1	5 games ناقصة (seq-mem, argument-analyzer, ...)	6h
2	6 bonus games (add 4 missing files each)	4h
3	RTL + AR testing	2h
4	Deployment	2h
14. Known Issues
#	Issue	Priority
1	argument-analyzer-stages.js = 0 B	High
2	6 bonus games بها 4 files only	Medium
3	Dashboard design Generic	High (Claude يعالجه)
4	motion-lab rejected designs	Low (مؤجل)
5	Integration with backend	High (Phase 2)
15. القواعد الذهبية للـ AI الجديد
✅ افعل:

Vanilla JS + CSS + HTML فقط

اتبع 8-file pattern

استخدم FLASH_I18N.t() لكل string

استخدم FlashSettings (مش per-game)

اختبر في المتصفح بعد كل تغيير

Full files only

❌ لا تفعل:

Frameworks (React/Vue/Svelte)

Build step (Vite/Webpack)

TypeScript في الفرونت

Tailwind

Hardcoded English strings

Partial files/diffs

تغيير script order

16. User Context
المستخدم:

مصري (Egyptian Arabic + Technical English)

Vibe Coder — يفهم، لا يكتب كود

يعتمد على AI في الكتابة الدقيقة

يريد نتائج سريعة

"اللي بعدو" = Next

"تمم" = Done

"كمّل" = Continue

Communication style:

Tables + Emojis + Markdown

Full files only

One game at a time

Test after each phase

آخر تحديث: 2026-10-09
Next AI: انتظر Claude لإكمال User Dashboard + Admin + Game Shell، ثم ابدأ Phase 2 (Backend Integration)