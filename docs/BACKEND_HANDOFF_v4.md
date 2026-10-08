# FLASH Backend — Handoff v4.0

**التاريخ:** 2026-10-09
**الإصدار:** v4.0 (Post Sprint 0 → Sprint 4)
**المرجع السابق:** `BACKEND_HANDOFF_v3.md` (2026-10-08)
**الحالة:** Sprint 0/2/3 مكتملة · Sprint 4 جزئياً

---

## 0. ملخص تنفيذي

Backend تطوّر عبر 4 sprints خلال يومين. Endpoints من **40 → 62**، Migrations من **11 → 15**، أُضيف **Player Auth + Admin Identity + Play Tickets + Demo Cohorts + Speed Package**.

**الركائز الأساسية اللي اتبنت:**

| المحور | Sprint |
|---|---|
| **Speed & Cleanup** | Sprint 0 (compression, cache, cleanup) |
| **Security & Reliability** | Sprint 2 (R05 lock, R11 rate limits, R12 helmet, R24 checksums) |
| **Auth + Admin** | Sprint 2.5 + 3 (admin bootstrap, player OTP) |
| **Data Integrity** | Sprint 4 (R06 play tickets, R09 backups) |
| **Demo Readiness** | Sprint 4 (M11-01 origin, M11-02 cohort) |

---

## 1. Before vs After

| المقياس | قبل (v3) | بعد (v4) |
|---|---|---|
| **Endpoints** | 40 | **62** |
| **DB Tables** | 40 | **47** |
| **Migrations** | 11 | **15** |
| **Services جديدة** | — | 7 (auth, admin-auth, tickets, sanitize, cache, user-lock, stats) |
| **Middleware** | 0 | 2 (auth, admin-auth) |
| **TypeScript errors** | 0 | **0** |
| **Bugs Fixed** | 17 | **17 + 5 جديدة** |
| **Tests (ps1/mjs)** | 0 | 8 |

---

## 2. Sprint 0 — Cleanup & Fixes ✅

**Duration:** ~2 hours · **Cost:** $0

### المهام المُنفَّذة
| # | المهمة | الحالة |
|---|---|---|
| 1 | حذف 9 ملفات .bak* | ✅ |
| 2 | نقل audit.ts + verify-seed.ts لـ scripts/ | ✅ |
| 3 | حذف check-*.ts (3 files) | ✅ |
| 4 | حذف debug outputs (dev.log, *.txt) | ✅ |
| 5 | حذف src/plugins/ الفاضي | ✅ |
| 6 | Fix env.ts defaults (GEMINI, OPENROUTER) | ✅ |
| 7 | Fix game.template.html (6 → 8 scripts) | ✅ |
| 8 | .gitignore شامل + !.env.example | ✅ |
| 9 | .env.example محدّث (كل المتغيرات) | ✅ |
| 10 | SECURITY.md جديد | ✅ |
| 11 | test.ps1 (12 checks + clipboard + beep) | ✅ |

**Commit:** `74c2208 chore(sprint-0): cleanup, template fix, env defaults, security docs`

---

## 3. Sprint 1 — Security & Infra ✅

### Step 1.1 — Backups (R09)
- **Script:** `scripts/backup-db.ts`
- **Encryption:** AES-256-GCM
- **CLI:** `npm run backup`
- **Env vars:** `BACKUP_KEY`, `BACKUP_DIR`, `BACKUP_KEEP_LAST`
- **Storage:** `backups/` (gitignored)
- **أول backup:** 39 tables · 786 rows · 270KB · decryptable ✅

### Step 1.2 — Migration Checksums (R24)
- **Migration 012:** يضيف `checksum TEXT` إلى `_migrations`
- **migrate.ts:** SHA-256 لكل ملف + tamper detection + ABORT
- **التغطية:** 11 migration (baseline) + كل جديدة
- **Env:** `MIGRATE_ALLOW_CHECKSUM_DRIFT=1` للـ emergency

### Step 1.3 — Edge Hardening (R12)
- **`@fastify/helmet`:** 7 security headers
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `X-DNS-Prefetch-Control: off`
  - `X-Download-Options: noopen`
  - `X-Permitted-Cross-Domain-Policies: none`
  - `Referrer-Policy: no-referrer`
  - `Strict-Transport-Security` (production only)
- **`src/services/sanitize.ts`:** bidi/zero-width/control char stripper
- **Test:** `test-security.ps1` → 7/7 PASS

### Step 1.4 — Secrets & CI (R13)
- **`.github/workflows/ci.yml`:** TypeScript + verify-catalog + gitleaks
- **`.github/dependabot.yml`:** weekly npm + monthly actions
- **`.github/CODEOWNERS`:** @khalid8923

### Step 1.5 — Health Split (R10)
- **`/health`:** liveness، **لا DB**
- **`/ready`:** DB + migrations + games counts + retry (Neon cold start)
- **Test:** `test-health.ps1`

### Step 1.6 — Speed Package ⚡
| البند | التفاصيل |
|---|---|
| **`@fastify/compress`** | gzip + brotli (threshold 1KB) |
| **`db.ts`** | pool tuning: max=10, keepAlive, statement_timeout=15s |
| **`cache.ts`** | in-memory cache + ETag + 304 |
| **`games.ts`** | Cache + ETag على `/games` و `/domains` |
| **النتيجة** | **3768ms → 36ms** بعد أول hit |

---

## 4. Sprint 2 — Data Integrity & Security ✅

**Commit:** `3e07ddd feat(sprint-2): R05 write lock + R11 rate limits + M1 admin bootstrap`

### 4.1 R05 — Write Serialization
- **`src/services/user-lock.ts`:** per-user advisory lock
- **`sessions.ts`:** الـ critical section داخل `withUserLock`
- **Test:** 5 concurrent نفس `client_session_id` → 1×201 + 4×200 ✅

### 4.2 R11 — Rate Limiting (layered)
- **`src/config/rate-limit.ts`:** نماذج limits (PUBLIC, AI, SESSION, ADMIN, VOICE, AUTH)
- **`server.ts`:** global rate limit + headers (`X-RateLimit-*` + `Retry-After`)
- **Allow-list:** `/health`, `/ready`, OPTIONS
- **Status:** ⚠️ 429 بيظهر تحت burst عادي، بس مع pool 10 بقي أفضل

### 4.3 M1 — Admin Bootstrap
- **Migration 013:** `admin_users` + `admin_audit_log` + `users.origin/status/locale`
- **`src/services/admin-auth.ts`:** token gen (adm_xxx) + SHA-256 hash + hash-chained audit
- **`src/middleware/admin-auth.ts`:** `requireAdmin(role)` + `audit()`
- **`src/routes/admin-auth.ts`:** 7 endpoints
  - POST /admin/auth/login
  - GET  /admin/auth/me
  - POST /admin/auth/logout
  - GET  /admin/admins
  - POST /admin/admins/invite
  - POST /admin/admins/:id/revoke
  - GET  /admin/audit
  - GET  /admin/audit/verify
- **Script:** `npm run admin:setup -- <email> "<name>"`
- **Token storage:** `.admin-token` (gitignored)
- **First owner:** owner@flash.local (Khalid)
- **Test:** 6/6 PASS

---

## 5. Sprint 3 — Player Auth + Admin AI ✅

**Commit:** `b54769c feat(sprint-3): player auth (OTP) + admin AI health`

### 5.1 R03a — Auth Schema
- **Migration 014:** 3 جداول
  - `auth_identities` (provider, subject → player_id)
  - `auth_sessions` (token_hash, idle + abs expiry, revoked_at)
  - `auth_otp_codes` (email, code_hash, attempts, expiry)

### 5.2 R03b — Auth Logic
- **`src/services/auth.ts`:**
  - `requestOTP(email)` — rate limit 5/hour، dev_code in dev
  - `verifyOTP(email, code)` — constant-time compare، session token
  - `verifySession(token)` — idle + abs expiry check
  - `revokeSession`, `revokeAllForPlayer`, `getPlayer`
- **`src/middleware/auth.ts`:** `requirePlayer`, `optionalPlayer`
- **`src/routes/auth.ts`:** 4 endpoints
  - POST /auth/otp/request
  - POST /auth/otp/verify
  - GET  /auth/me
  - POST /auth/logout
- **Test:** 4/4 PASS

### 5.3 M6-01 — Admin AI Health
- **`src/routes/admin-ai.ts`:**
  - GET /admin/ai/health — provider status + models
  - GET /admin/ai/providers — enabled list
- **Test:** 2/2 PASS

---

## 6. Sprint 4 — Play Tickets + Demo Cohorts ⚠️

### 6.1 R06 — Play-ticket v2
- **Migration 015:** enhancement لـ `play_tickets`
  - أعمدة جديدة: `game_id`, `mode`, `level`, `player_id`, `device_id`
  - Tracking: `consumed_at`, `rejected_at`, `rejected_reason`
- **`src/services/tickets.ts`:**
  - `issueTicket()` — token (tkt_xxx) + seed (16 hex) + 30min TTL
  - `consumeTicket()` — single-use + atomic via `FOR UPDATE`
  - `expireOldTickets()` — housekeeping
- **`src/routes/plays.ts`:**
  - POST /plays — issue
  - POST /plays/consume — verify + consume
- **Status:** 🐛 **BUG** — `POST /plays` يرجع **500** في الاختبار

### 6.2 M11-01/02 — Demo Readiness
- **`src/routes/admin-demo.ts`:**
  - GET  /admin/demo/origins — breakdown by origin
  - POST /admin/demo/users/:id/origin — set origin
  - POST /admin/demo/generate — synthetic cohort
  - POST /admin/demo/reset — delete demo/test users
- **Test:** 3/3 PASS

### 6.3 Sprint 4 Test Results
| Test | Status |
|---|---|
| A1: POST /plays | ❌ 500 |
| A2: POST /plays/consume | ⏭️ skipped |
| A3: reuse → 400 | ⏭️ skipped |
| B1: /admin/demo/origins | ✅ |
| B2: /admin/demo/generate | ✅ |
| B3: /admin/demo/reset | ✅ |

**النتيجة:** 3/4 PASS — في bug في الـ tickets.

---

## 7. Bugs & Fixes (هذا الـ Sprint)

### BUG-021 — `POST /plays` 500 Internal Server Error

**Symptom:** عند استدعاء `POST /plays` من player authenticated → 500.

**Root cause (مرجّح):**
- Migration 015 ضاف عمود `token_hash` **مش موجود** في الـ schema الأصلي
- الـ INSERT بيستخدم `token_hash` لكن العمود مش موجود
- أو `id UUID` معرّف بطريقة معينة بدون default

**Fix المقترح:**
```sql
-- Migration 016 (fix)
ALTER TABLE play_tickets ADD COLUMN IF NOT EXISTS token_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_play_tickets_token_hash
  ON play_tickets(token_hash) WHERE token_hash IS NOT NULL;
Status: 🔴 OPEN — يحتاج migration 016 + إعادة test.

8. Database Schema (47 tables)
8.1 الجداول الجديدة (من v3 → v4)
Table	Sprint	الغرض
admin_users	2.5	5 roles: owner/ops/science/support/analyst
admin_audit_log	2.5	hash-chained audit
auth_identities	3	provider → player_id mapping
auth_sessions	3	opaque tokens + idle/abs expiry
auth_otp_codes	3	6-digit OTP + attempts + expiry
8.2 Migrations (15 إجمالي)
#	File	Sprint
001-011	(من v3)	Pre
012	migration_checksums.sql	1.2
013	admin_bootstrap.sql	2.5
014	player_auth.sql	3
015	tickets_v2.sql	4
016	(TODO) fix play_tickets.token_hash	⏳
9. Endpoints — القائمة الكاملة (62)
Core (10)
/health, /ready, /domains, /games, /plan, /profile, /ability, /next/:gameId, /decisions, /sessions (GET/POST)

Auth (4) 🆕
/auth/otp/request, /auth/otp/verify, /auth/me, /auth/logout

Plays (2) 🆕
/plays, /plays/consume

AI Core (9)
/ai/status, /ai/generate, /ai/chat, /ai/conversations, /ai/conversations/:id, /ai/recap, /ai/insights, /ai/daily-plan, /ai/health

AI Features (21)
nudge, fingerprint, variants, predictions, journal, voice, lab, director, lessons, error-patterns, transfer-tracker

Admin Auth (8) 🆕
/admin/auth/* (4) + /admin/admins/* (3) + /admin/audit/* (2)

Admin AI (2) 🆕
/admin/ai/health, /admin/ai/providers

Admin Demo (4) 🆕
/admin/demo/origins, /admin/demo/users/:id/origin, /admin/demo/generate, /admin/demo/reset

Admin Catalog (6) [من v3]
/admin/catalog/*

10. File Structure (Backend)
text
backend/
├── scripts/
│   ├── audit-db.ts              🆕 Sprint 0
│   ├── backup-db.ts             🆕 Sprint 1.1
│   ├── setup-owner.ts           🆕 Sprint 2.5
│   ├── verify-catalog.ts
│   ├── verify-db.ts
│   └── verify-seed.ts           🆕 Sprint 0
├── src/
│   ├── config/
│   │   ├── db.ts                ✏️ Sprint 1.6 (pool tuning)
│   │   ├── env.ts               ✏️ Sprint 0
│   │   ├── rate-limit.ts        🆕 Sprint 2 (R11)
│   │   └── env.ts
│   ├── middleware/              🆕 Sprint 2.5/3
│   │   ├── admin-auth.ts
│   │   └── auth.ts
│   ├── migrations/
│   │   ├── 001-011              (من v3)
│   │   ├── 012_migration_checksums.sql  🆕
│   │   ├── 013_admin_bootstrap.sql      🆕
│   │   ├── 014_player_auth.sql          🆕
│   │   └── 015_tickets_v2.sql           🆕
│   ├── routes/
│   │   ├── admin-ai.ts          🆕 Sprint 3
│   │   ├── admin-auth.ts        🆕 Sprint 2.5
│   │   ├── admin-demo.ts        🆕 Sprint 4
│   │   ├── auth.ts              🆕 Sprint 3
│   │   ├── games.ts             ✏️ Sprint 1.6 (cache + ETag)
│   │   ├── health.ts            ✏️ Sprint 1.5 (split)
│   │   ├── plays.ts             🆕 Sprint 4 ⚠️
│   │   └── sessions.ts          ✏️ Sprint 2 (R05)
│   ├── services/
│   │   ├── admin-auth.ts        🆕 Sprint 2.5
│   │   ├── auth.ts              🆕 Sprint 3
│   │   ├── cache.ts             🆕 Sprint 1.6
│   │   ├── sanitize.ts          🆕 Sprint 1.3
│   │   ├── tickets.ts           🆕 Sprint 4 ⚠️
│   │   └── user-lock.ts         🆕 Sprint 2 (R05)
│   ├── migrate.ts               ✏️ Sprint 1.2 (SHA-256)
│   └── server.ts                ✏️ كل Sprint
├── test.ps1                     🆕 Sprint 0
├── test-security.ps1            🆕 Sprint 1.3
├── test-health.ps1              🆕 Sprint 1.5
├── test-catalog.ps1             🆕 Sprint 1.6
├── test-rate-limit.ps1          🆕 Sprint 2
├── test-r05.mjs                 🆕 Sprint 2
├── SECURITY.md                  🆕 Sprint 0
└── .admin-token                 🆕 Sprint 2.5 (gitignored)
11. Environment Variables
env
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://...

# Auth (Admin)
AUTH_SECRET=...
AUTH_URL=http://localhost:3000
ADMIN_TOKEN=...  # Legacy, retired for humans

# Backups 🆕
BACKUP_KEY=<base64-32-byte>
BACKUP_DIR=./backups
BACKUP_KEEP_LAST=7

# AI — Groq
GROQ_API_KEY=...
GROQ_MODEL_EN=openai/gpt-oss-120b
GROQ_MODEL_AR=allam-2-7b
GROQ_MODEL_FAST=openai/gpt-oss-20b

# AI — OpenRouter
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free

# AI — Gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash

# Voice
VOICE_MODEL=whisper-large-v3-turbo
VOICE_MAX_BYTES=10485760

# Frontend
CORS_ORIGIN=http://localhost:5173,http://localhost:8080
12. Test Suite (8 ملفات)
الملف	الغرض	آخر نتيجة
test.ps1	Sprint 0 master (12 checks + clipboard + beep)	ALL PASS
test-security.ps1	7 security headers	7/7 PASS
test-health.ps1	/health + /ready	ALL PASS
test-catalog.ps1	ETag + 304 + cache	4/4 PASS
test-rate-limit.ps1	X-RateLimit headers	partial
test-r05.mjs	5 concurrent same session	ALL PASS
Sprint 3 test	Auth + Admin AI	4/4 PASS
Sprint 4 test	Tickets + Demo	3/4 FAIL ⚠️
13. Known Issues (Updated)
#	Issue	Priority	Status
1	POST /plays → 500	🔴 High	OPEN — يحتاج Migration 016
2	Rate limit 429 مش ثابت تحت burst	🟡 Medium	Partial
3	nudge latency ~2.5s	🟡 Medium	مؤجل
4	Auth = demo user (لسه getOrCreateDemoUser)	🟡 Medium	Sprint 5
5	Sync = pending	🟡 Medium	Sprint 6
6	Deployment config	🟡 Medium	Sprint 7
7	مفيش tests تلقائية	🟡 Medium	Sprint 7
8	Node 20 EOL — خلاص على 24	✅ Done	—
9	Legacy ADMIN_TOKEN (shared)	✅ Retired	—
14. Roadmap — Sprint 5+
Sprint 5 — Auth Integration + R07 (1-2 أسابيع)
R03c: استبدال getOrCreateDemoUser() بـ req.player.playerId

R07: Ingestion hardening (server re-derivation from seed)

Migration 016: fix play_tickets.token_hash

Migration 017: sessions.player_id (لو محتاج)

Sprint 6 — Sync Protocol (2-3 أسابيع)
R28: GET /sync/changes + POST /sync/push

R32: Model registry for Groq deprecations

R22: Trial storage format compact encoding

Sprint 7 — Privacy & Polish (2 أسابيع)
R19: Data inventory + retention

R20: Erasure + Export (/me/export, DELETE /me)

R26: Golden fixture tests

Sprint 8+ — Features
R40: Integrity rules (shadow mode)

R34: Norms pipeline

R14: AI content pool

R16: AI quota ledger

15. Admin System Roadmap (من Admin Spec)
Phase 0 — Day-Zero ✅ (Sprint 2.5-3)
M1: Admin Identity + Audit ✅

M6-01: AI Health ✅

M11-01/02: Origin + Cohort ✅

Phase A — Before Investor Demo (المتبقي P0)
M2-01, M2-02, M2-03 (catalog registry, drift, enable/disable)

M2-07 (claims lexicon)

M3-01, M3-02, M3-03 (difficulty explorer, freeze, decisions review)

M4-01, M4-02, M4-03 (integrity queue, review, invalidation)

M6-02, M6-03, M6-04, M6-05 (AI budget, output filter, moderation, prompt registry)

M7-01, M7-02 (job runner, rebuilds)

M8-01, M8-02 (metric dictionary, funnel)

M9-01 (feature flags)

M11-03, M11-04 (scripted accounts, pre-demo health)

M12-01, M12-02, M12-03 (data inventory, processor register, PII redaction)

M13-01 (health)

Phase B — Public Beta (P1)
باقي M1 → M13

Phase C-D — Maturity (P2-P4)
16. Sprint 4 Test — Output للتحقق
النتائج الحالية:
text
[A1] POST /plays
  [FAIL] The remote server returned an error: (500) Internal Server Error.

[A2] POST /plays/consume (skipped بسبب فشل A1)
[A3] Reuse (skipped)

[B1] GET /admin/demo/origins
  [PASS] 1 origin types

[B2] POST /admin/demo/generate
  [PASS] batch=demo_mv03q712 created=3

[B3] POST /admin/demo/reset
  [PASS] deleted=3

#  SPRINT 4: 3 PASS / 1 FAIL
Steps التالية:
تشغيل Migration 016 (fix play_tickets.token_hash)

إعادة test-r05.mjs أو re-run Sprint 4 test

بعد نجاح → commit feat(sprint-4): play tickets v2 + demo cohorts

17. Commands Cheat Sheet
powershell
# Development
cd D:\Flash\backend
npm run dev

# Migration
npm run migrate

# First-time admin owner
npm run admin:setup -- owner@example.com "Owner Name"

# Backup (encrypted)
npm run backup

# TypeScript check
npx tsc --noEmit

# Full verifier
powershell -ExecutionPolicy Bypass -File verify.ps1

# Kill node
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Tests
.\test.ps1
.\test-security.ps1
.\test-health.ps1
.\test-catalog.ps1
18. تشغيل على جهاز جديد (Onboarding)
Setup Steps:
git clone https://github.com/khalid8923/flash.git

cd backend && npm install

Copy .env.example → .env (املأ DATABASE_URL, AUTH_SECRET, BACKUP_KEY, GROQ_API_KEY)

npm run migrate

npm run seed && npm run seed:atlas

npm run admin:setup -- your@email.com "Your Name" — ينشئ first owner

احفظ التوكن في .admin-token

npm run dev

Test: curl http://localhost:3000/health

Security Notes:
⚠️ لا ترفع .env أبداً

⚠️ .admin-token gitignored

⚠️ لا تعدّل migrations 001-015 (checksum هيرفض)

⚠️ لو محتاج drift emergency: $env:MIGRATE_ALLOW_CHECKSUM_DRIFT="1"; npm run migrate

19. تعليمات للـ AI الجديد (v5)
قبل ما تبدأ:
اقرأ BACKEND_HANDOFF_v3.md (السياق الأصلي)

اقرأ BACKEND_HANDOFF_v4.md (هذا الملف)

اقرأ docs/PROJECT_HANDOFF/00_INDEX.md (السياق الشامل)

اقرأ docs/contracts/01-04 (Schemas)

اقرأ docs/06_PLAYER_INTELLIGENCE.md (Evidence Ladder)

اقرأ docs/POWERSHELL_WORKFLOW.md (قواعد PowerShell)

القواعد الذهبية:
✅ Full files only — مفيش partial/diffs

✅ Name + Path + Type قبل كل code block

✅ Migration جديدة = رقم جديد (016+)

✅ UTF-8 no BOM في PowerShell

✅ اختبار بعد كل تغيير

✅ Commit at milestones — مش كل ملف

❌ متعدّلش migrations 001-015

❌ متلمسش الـ frontend

❌ مفيش L4 claims (طبي/تشخيصي)

User Context:
Language: مصري + Technical English

Style: Vibe Coder — يفهم المفاهيم

Testing: يدوي في المتصفح بعد كل Phase

Signals: "تمم" = Done · "اللي بعدو" = Next · "كمّل" = Continue
