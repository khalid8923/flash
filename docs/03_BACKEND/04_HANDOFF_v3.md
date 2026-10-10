# FLASH Backend — Handoff v3.0

**التاريخ:** 2026-10-08
**الإصدار:** v3.0 (بعد Catalog System + Stats Fix + Soft Delete)
**المرجع السابق:** `BACKEND_HANDOFF_v2.md`
**الحالة:** Backend جاهز للإنتاج — Catalog قابل للتوسّع

---

## 0. ملخص في 3 سطور

> Backend فيه الآن **نظام Catalog احترافي** (36 لعبة في ملفات config بدل موزّعة)، **إدارة ألعاب عبر API**، **Stats محسوبة تلقائياً**، **Soft Delete** للألعاب، و**Verifier** يفحص كل حاجة بأمر واحد.

---

## 1. Before vs After

| المقياس | v2 (07 أكتوبر) | v3 (08 أكتوبر) |
|---------|:---:|:---:|
| **Endpoints** | 35 | **40** |
| **DB Tables** | 40 | 40 |
| **Migrations** | 9 | **11** |
| **AI Services** | 22 | 24 |
| **Game configs** | موزّعة على 3 ملفات | **36 ملف مستقل** |
| **Tests/Verify** | يدوي | **auto verifier** |

---

## 2. ما تم في v3

### 2.1 Catalog System (الأهم)

**الفكرة:** كل لعبة = ملف TS واحد.
backend/src/catalog/
├── types.ts # GameConfig schema
├── registry.ts # lookup + validation
├── _meta.ts # AR names, icons, citations
├── _migrate.ts # DB → TS generator
├── index.ts # public API
└── games/
├── flanker.ts
├── go-no-go.ts
└── ... (36 ملف)

text

**الفايدة:**
- إضافة لعبة = ملف واحد + سطرين في registry + sync
- تعديل لعبة = تعديل ملف واحد
- validation تلقائي لكل config

**التشغيل:**
```powershell
npx tsx src/catalog/_migrate.ts         # DB → TS
npx tsx src/catalog/_migrate.ts --clean # إعادة توليد
2.2 Admin API
Endpoints:

Method	Path	Purpose
GET	/admin/catalog	List configs + DB
GET	/admin/catalog/drift	Sync check
GET	/admin/catalog/:id	One config
POST	/admin/catalog/sync	Full sync
POST	/admin/catalog/:id/disable	Soft delete
POST	/admin/catalog/:id/enable	Restore
الحماية: كل route محتاج header x-admin-token: <ADMIN_TOKEN>.

2.3 Stats Fix
الجدولين اللي كانوا فاضيين بقوا بيتحسبوا تلقائياً:

user_game_stats — aggregates بعد كل session

domain_scores — score لكل domain

Service: services/stats.ts

updateUserGameStats(userId, gameId, variant)

updateDomainScores(userId)

recomputeAllStats(userId) — rebuild يدوي

Integration: في routes/sessions.ts بعد الـ badges (non-fatal).

2.4 Soft Delete
games table:

sql
ALTER TABLE games
  ADD COLUMN deleted_at TIMESTAMPTZ,
  ADD COLUMN deleted_reason TEXT;
كل query بيفلتر: WHERE deleted_at IS NULL.

قواعد:

مسح لعبة = deleted_at = NOW()

إرجاع = deleted_at = NULL

Sessions القديمة محفوظة

2.5 Verifier System
الأمر:

powershell
cd D:\Flash\backend
powershell -ExecutionPolicy Bypass -File verify.ps1
فحص 5 حاجات:

Files existence (10 ملف)

TypeScript (0 errors)

Catalog (36 valid)

DB connection + counts

Admin routes registered

Output: ALL CHECKS PASSED أو تقرير بـ FAIL.

3. Migrations in v3
#	File	Purpose
010	010_soft_delete_and_indexes.sql	Soft delete + 6 indexes
011	011_games_defaults.sql	NOT NULL + defaults
4. Bugs Fixed in v3
#	Bug	Fix
001	user_game_stats + domain_scores never updated	Added stats.ts + wiring
002	games allowed NULL in critical columns	Migration 011 + defensive code
003	Missing hot-path indexes	Migration 010
004	Games couldn't be safely deleted	Soft delete pattern
005	32 TypeScript errors (noUncheckedIndexedAccess)	Null checks في 5 ملفات
006	pg returns DATE as Date object	::text cast in SQL
007-013	AI-related bugs (Groq tokens, OpenRouter, Gemini)	See FIX_LOG_V1.md
التفاصيل الكاملة: docs/FIX_LOG_V1.md

5. Endpoints — التحديث
جديد في v3 (5 endpoints):

text
GET    /admin/catalog
GET    /admin/catalog/drift
GET    /admin/catalog/:id
POST   /admin/catalog/sync
POST   /admin/catalog/:id/disable
POST   /admin/catalog/:id/enable
الإجمالي: 40 endpoint (كان 35).

6. Environment Variables (v3)
جديد:

env
ADMIN_TOKEN=<random hex — auto-generated>
كل متغيرات v2 موجودة + ADMIN_TOKEN.

7. التشغيل اليومي
powershell
# Development
cd D:\Flash\backend
npm run dev

# Catalog sync (بعد تعديل catalog)
npm run catalog:sync

# Verifier (فحص شامل)
powershell -ExecutionPolicy Bypass -File verify.ps1

# Migrations
npm run migrate
8. إضافة لعبة جديدة (Backend فقط)
الخطوات:

أنشئ ملف src/catalog/games/new-game.ts (انسخ من flanker.ts)

عدّل _meta.ts — أضف entry (AR name, icon, citation)

عدّل registry.ts — أضف import + entry في ALL_GAMES

شغّل npm run catalog:sync (3-4 دقائق)

تحقق verify.ps1 → ALL PASSED

الوقت: 25-30 دقيقة.

Frontend (منفصل): 8 ملفات يدوية — 5-6 ساعات.

9. المتبقي (v4 + v5 — قادم)
v4 (مقترح):

Auth (Better Auth + Resend)

User endpoints (signup/login/me)

Migrate demo user → real users

v5 (مقترح):

Sync protocol (offline-first)

Guest migration

Change tracking

مؤجل:

Deployment (Dockerfile + Render)

Tests (fixtures)

Structured logging (Pino correlation IDs)

10. Files Structure (v3)
text
backend/
├── scripts/
│   ├── verify-catalog.ts     🆕
│   └── verify-db.ts          🆕
├── src/
│   ├── catalog/              🆕 (40 ملف)
│   │   ├── types.ts
│   │   ├── registry.ts
│   │   ├── _meta.ts
│   │   ├── _migrate.ts
│   │   ├── index.ts
│   │   └── games/*.ts (36)
│   ├── migrations/
│   │   ├── 010_soft_delete...sql  🆕
│   │   └── 011_games_defaults.sql 🆕
│   ├── routes/
│   │   └── admin-catalog.ts       🆕
│   ├── scripts/
│   │   └── sync-catalog.ts        🆕
│   └── services/
│       ├── catalog-sync.ts        🆕
│       └── stats.ts               🆕
├── verify.ps1                     🆕
└── docs/
    ├── BACKEND_HANDOFF_v3.md      📄 (هذا)
    └── FIX_LOG_V1.md              📄
11. Git History
text
0c8cb3e feat(backend): catalog system + admin API + stats fix + soft delete
ec7a7a4 feat(ai): complete AI layer - 12 features + multi-provider router + voice + director
...
آخر تحديث: 2026-10-08