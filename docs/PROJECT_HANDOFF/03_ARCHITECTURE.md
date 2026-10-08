# 03 — المعمارية التقنية الكاملة

## 3.1 الطبقات الثلاث
LAYER 1: DASHBOARD (frontend/dashboard/)

يعرض 9 domains + 36 games

يفتح الألعاب في iframe

يستقبل postMessage

LAYER 2: SHARED SYSTEMS (frontend/shared/)

i18n.js (EN + AR + RTL)

settings.js (global settings + music)

flash-stages.js (8-stage system)

LAYER 3: GAMES (frontend/games/{domain}/{game-id}/)

8 ملفات لكل لعبة

self-contained

يستخدم shared systems

text

## 3.2 مسار تحميل اللعبة

1. المستخدم يفتح `FLASH.html`
2. الـ dashboard يحمّل 5 scripts
3. `flash-core.js` يعمل `init()`
4. المستخدم يضغط لعبة → `FLASH.loadGame(gameId)`
5. اللعبة تفتح في iframe
6. اللعبة تحمّل 8 ملفات بترتيب مقدس
7. عند نهاية جلسة → `postMessage` للـ parent
8. الـ parent يستقبل ويحدّث UI

## 3.3 نمط الـ 8 ملفات (Sacred)
frontend/games/{domain}/{game-id}/
├── config.json ← Metadata (documentation only)
├── game.html ← HTML + 8 script tags
├── game.css ← ~500 خاص + ~450 مشترك
├── game.js ← المنطق الأساسي
├── {game}-helpers.js ← Storage + PB + History + Badges
├── {game}-sounds.js ← Web Audio API
├── {game}-stages.js ← 8 مراحل
└── {game}-extra-modes.js ← 4 مودات إضافية

text

**الإجمالي:** ~3000 سطر لكل لعبة

## 3.4 ترتيب تحميل Scripts (حرج)

```html
<script src="../../../shared/i18n.js"></script>
<script src="../../../shared/settings.js"></script>
<script src="../../../shared/flash-stages.js"></script>
<script src="{game}-stages.js"></script>
<script src="{game}-helpers.js"></script>
<script src="{game}-sounds.js"></script>
<script src="{game}-extra-modes.js"></script>
<script src="game.js"></script>
لا يتم تغيير هذا الترتيب أبدًا.

3.5 معمارية الباك إند
Stack
الطبقة	التقنية
Framework	Fastify 5.1
Language	TypeScript 5.6
Database	Neon PostgreSQL 17
Validation	Zod 3.23
Runtime	Node.js 20+
طبقات الباك إند
text
backend/src/
├── config\               ← env + db
├── routes\               ← 6 ملفات endpoints
├── services\
│   ├── ai\               ← 7 ملفات (Groq + Gemini + Coach)
│   ├── difficulty\       ← 3 ملفات (Atlas + Engine)
│   ├── derive.ts         ← حساب metrics
│   ├── pb.ts             ← Personal Best
│   ├── badges.ts         ← Badge unlocking
│   ├── planner.ts        ← Daily Ritual
│   ├── recommendations.ts ← Rule-based recs
│   └── users.ts          ← Demo user + change_seq
├── schemas\              ← Zod schemas
├── migrations\           ← 7 SQL files
├── migrate.ts            ← Runner
├── seed.ts               ← Seed: 9+36+15
├── seed-atlas.ts         ← Seed: 540 levels
└── server.ts             ← Bootstrap
3.6 Endpoints (17 endpoint)
#	Method	Path	الوصف
1	GET	/health	حالة السيرفر + DB
2	GET	/domains	9 domains
3	GET	/games	36 لعبة
4	GET	/plan	Daily Ritual
5	GET	/profile	بروفايل + recs
6	GET	/ability	قدرة المستخدم
7	GET	/next/:gameId	المستوى القادم
8	GET	/decisions	قرارات المحرك
9	GET	/sessions	آخر 30 جلسة
10	POST	/sessions	ingest كامل
11	GET	/ai/status	حالة AI
12	POST	/ai/generate	توليد محتوى
13	POST	/ai/chat	محادثة AI Coach
14	GET	/ai/conversations	قائمة المحادثات
15	GET	/ai/conversations/:id	محادثة واحدة
3.7 نموذج البيانات
Append-Only Facts
sessions — immutable

session_trials — JSONB per session

Derived (قابل لإعادة البناء)
personal_bests — الأفضل لكل لعبة

user_badges — الشارات

domain_scores — درجات المجالات

user_game_stats — إحصائيات

AI Data
generated_content_cache — المحتوى المولّد

ai_conversations + ai_messages

user_cognitive_profile

engine_decisions — قرارات المحرك

3.8 تكامل AI
Model Routing
text
Arabic  → allam-2-7b      (SDAIA، context صغير → compression)
English → gpt-oss-120b    (OpenAI، context كامل)
أنماط AI
Content Generation — 36 prompt template

Chat — Coach يعرف كل بيانات المستخدم

Adaptive Difficulty — Weighted staircase (بدون ML)

Planner — يقترح Daily Ritual

Recommendations — Rule-based

3.9 التواصل بين الطبقات
text
Frontend (browser)
    ↓ HTTP fetch
Backend (Fastify :3000)
    ↓ pg pool
Neon PostgreSQL
    ↓ Groq API
AI Models
3.10 Backend Stack Deep Dive
Middleware
CORS (Open in dev)

Rate Limit (200 req/min)

Body Limit (2 MB)

Structured Logging (Pino)

Error Handling
Zod validation → 400

DB errors → 500 with generic message

AI failures → 503 fallback

Database Pool
Max: 10 connections

Idle timeout: 30s

Connection timeout: 5s

3.11 الفرونت الجديد (Antigravity) — قيد التطوير
البنية
text
D:\flash-cognitive-studio\frontend-clean\
├── index.html          ← Entry point
├── shared\
│   ├── js\             ← api, i18n, motion, router, state
│   └── styles\         ← tokens, motion (+3 مفقودة)
└── views\              ← home.html (+ باقي الصفحات)
الحالة
✅ النظام الأساسي يعمل

⚠️ 3 ملفات CSS مفقودة (layout, components, rtl)

⏸️ متوقف مؤقتًا حتى إكمال الباك إند
'@
