# FLASH — Project Evolution Log

**التاريخ:** 2026-10-08
**الغرض:** سجل التطورات الكاملة من لحظة تسلّم الـ AI الجديد للمشروع
**المرجع:** `docs/PROJECT_HANDOFF/` (00 → 21) للـ context الأصلي

---

## 0. نظرة عامة

| المرحلة | التاريخ | المحتوى |
|--------|--------|---------|
| **Pre-AI** | قبل 07 أكتوبر | 36 لعبة Frontend + Backend أساسي (17 endpoint) |
| **V1** | 07 أكتوبر | AI Features (12 feature) + Router |
| **V2** | 08 أكتوبر | Catalog System + Stats Fix + Soft Delete |
| **V3** | قادم | Auth |
| **V4** | قادم | Sync |
| **V5** | قادم | Deployment |

---

## 1. Pre-AI State (ما قبل التسليم)

**Frontend:**
- 36 لعبة × 8 ملفات
- Dashboard (HTML/CSS/JS vanilla)
- Shared: i18n + settings + flash-stages
- postMessage protocol

**Backend:**
- Fastify 5 + TypeScript + Neon Postgres
- 17 endpoint
- 30 جدول
- 7 migrations
- AI features محدودة (generate + chat + status)

**Contracts Frozen:**
- Session Schema
- Trial Schema
- postMessage Protocol
- Game Catalog

---

## 2. V1 — AI Layer (07 أكتوبر)

### 2.1 الهدف
بناء طبقة AI كاملة فوق الـ Backend الموجود.

### 2.2 Sprint 1 — AI Features الأساسية

| # | Feature | Endpoint | Status |
|---|---------|----------|:---:|
| 1.1 | Session Recap | `POST /ai/recap` | ✅ |
| 1.2 | Weekly Insights | `GET /ai/insights` | ✅ |
| 1.3 | Content Validator | integrated | ✅ |

### 2.3 Sprint 1.5 — Multi-Provider Router
Groq → OpenRouter → Gemini → Rule fallback

text

**الملفات:**
- `router.ts`
- `health.ts` (circuit breaker)
- `providers/*.ts` (3 providers)

### 2.4 12 AI Features

| # | Feature | Endpoint(s) |
|---|---------|-------------|
| 1 | In-Game Micro-Coach | `POST /ai/nudge` |
| 2 | Cognitive Fingerprint | `GET /ai/fingerprint` |
| 3 | Dynamic Game Variants | `GET /ai/variants/*` |
| 4 | Predictive Coach | `GET /ai/predictions` |
| 5 | AI Journal | `POST /ai/journal/*` |
| 6 | Voice-First | `POST /ai/voice/chat` |
| 7 | AI Lab | `POST /ai/lab/*` |
| 8 | Director Mode | `POST /ai/director/*` |
| 10 | Micro-Lessons | `GET /ai/lessons/*` |
| 11 | Error Patterns | `GET /ai/error-patterns` |
| 12 | Transfer Tracker | `GET /ai/transfer-tracker` |
| 13 | Daily Plan | `GET /ai/daily-plan` |

### 2.5 Unified Snapshot

**`GET /profile/snapshot`** — API واحد للـ Dashboard.

**شكل الرد:**
```json
{
  "overall": { "headline", "subline", "evidence_tier" },
  "domain_cards": [ /* 9 cards */ ],
  "attention_areas": [ /* areas need work */ ],
  "strengths": [ /* areas strong */ ],
  "recent_milestones": [ /* level_ups, badges */ ],
  "next_best_action": { ... },
  "quick_stats": { ... }
}
Self-comparison only — مفيش مقارنة مع لاعبين آخرين.

2.6 Endpoints
الوصول لـ 35 endpoint في نهاية V1.

3. V2 — Catalog System (08 أكتوبر)
3.1 المشكلة اللي كانت
إضافة لعبة واحدة = 12 مكان مختلف + 45-60 دقيقة.

مسح لعبة = خطر فعلي (cascades + FK blocks).

3.2 الحل
Config-driven Catalog:

text
src/catalog/games/*.ts (36 ملف)
        ↓
registry.ts (lookup + validation)
        ↓
catalog:sync (migrate)
        ↓
DB (games + game_domain_weights + difficulty_configs)
3.3 Admin API
6 endpoints لإدارة الألعاب بدون كود:

List / Drift / Get

Sync

Disable / Enable (soft delete)

3.4 Stats Fix
user_game_stats + domain_scores بيتم تحديثهم تلقائياً بعد كل session.

3.5 Migrations 010 + 011
010: Soft delete + 6 hot-path indexes

011: NOT NULL + defaults لـ rt_ceiling_ms, max_score, rt_floor_ms

3.6 Verifier
verify.ps1 — أمر واحد يفحص:

Files

TypeScript

Catalog

DB

Admin routes

3.7 Endpoints
الوصول لـ 40 endpoint.

4. الإحصائيات الكاملة
المقياس	Pre-AI	V1	V2/V3
Endpoints	17	35	40
DB Tables	30	40	40
Migrations	7	9	11
AI Services	4	22	24
Game configs	DB only	DB only	36 TS files
Verifier	❌	❌	✅
5. Bugs Found & Fixed
V1: 6 AI bugs (Groq tokens, OpenRouter, Gemini, L4 filter, cache, JSON parse)

V2: 6 critical bugs (stats, games defaults, indexes, soft delete, TS errors, DATE cast)

الكامل: docs/FIX_LOG_V1.md

6. المتبقي (Roadmap)
V3 — Auth (قادم)
Better Auth + Resend

Signup / Login / Logout / Me

Email verification

Migrate demo user → real

V4 — Sync (قادم)
POST /sync (push + pull)

Change tracking via cursor

Guest migration

V5 — Deployment (قادم)
Dockerfile for Render

.env.example كامل

Pino correlation IDs

Golden fixture tests

7. الملفات المرجعية
الملف	الغرض
docs/PROJECT_HANDOFF/	Context الأصلي (00→21)
docs/contracts/01-04	Schemas
docs/06_PLAYER_INTELLIGENCE.md	Evidence Ladder
docs/BACKEND_HANDOFF_v1.md	V1 Handoff
docs/BACKEND_HANDOFF_v2.md	V2 Handoff
docs/BACKEND_HANDOFF_v3.md	V3 Handoff (هذا)
docs/FIX_LOG_V1.md	كل bugs V1+V2
docs/AI_CONTRACTS_v1.md	AI integration guide
8. القواعد الذهبية (لم تتغير)
Evidence Ladder
L0-L3 allowed

L4 (clinical) PROHIBITED

AI Rules
LLM phrases, never invents

Model routing: AR → allam, EN → gpt-oss

Router با multi-provider

Validator على كل output

Code Rules
Fastify 5 + TypeScript strict

Zod للـ validation

ESM (.js suffix)

Migrations جديدة للأمور الحرجة فقط

Git Rules
Commit at milestones

Conventional commits

No branches / PRs

No force push

9. KPIs الحالية
Metric	Value
Endpoints working	40
DB tables	40
Games in catalog	36
Difficulty levels	540
AI features	12
AI providers	3
Validator coverage	100% LLM output
Verifier checks	5
TypeScript errors	0
Broken migrations	0
آخر تحديث: 2026-10-08