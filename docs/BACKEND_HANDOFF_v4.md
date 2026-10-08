# FLASH Backend — Handoff v4.0

**Date:** 2026-10-09
**Version:** v4.0 (Post Sprint 0 → Sprint 17)
**Previous:** BACKEND_HANDOFF_v3.md (2026-10-08)
**Status:** Phase A complete — ready to deploy

---

## 0. Executive Summary

Backend evolved from v3 (40 endpoints) to v4 (~85 endpoints) across 17 sprints.

| Metric | v3 | v4 |
|---|---|---|
| Endpoints | 40 | ~85 |
| DB Tables | 40 | 51 |
| Migrations | 11 | 23 |
| Middleware | 0 | 3 |
| Services | 22 | 40+ |
| Tests (ps1/mjs) | 0 | 10 |
| Golden tests | 0 | 6 |
| TypeScript errors | 0 | 0 |
| Bugs fixed | 17 | 17 + 8 = 25 |

---

## 1. Sprint Summary

### Sprint 0 — Cleanup (commit 74c2208)
Deleted 9 bak files, moved scripts, cleaned outputs, fixed env.ts + game.template.html.

### Sprint 1 — Security & Infra
- R09 Backups (AES-256-GCM)
- R24 Migration checksums (SHA-256)
- R12 Edge hardening (helmet + sanitize)
- R13 CI + Dependabot
- R10 Health split (/health + /ready)
- Speed Package (compress + cache + ETag + pool tuning)

### Sprint 2 — Data Integrity (commit 3e07ddd)
- R05 Write lock (user advisory lock)
- R11 Rate limits (layered)
- M1 Admin Bootstrap (auth + audit log)

### Sprint 3 — Player Auth (commit b54769c)
- R03a/b: OTP + sessions + middleware
- M6-01: Admin AI Health

### Sprint 4 — Tickets + Demo
- R06: Play tickets v2
- M11-01/02: Origin + Demo cohorts
- Migration 016: fix play_tickets.token_hash

### Sprint 5 — Auth Sessions + Claims
- R03c: sessions with optionalPlayer
- M6-03: Claims lexicon (EN + AR)

### Sprint 6 — Ingestion + Registry
- R07: ingestion-validator.ts
- M2-01: admin-registry.ts

### Sprint 7 — Trial Stats + Difficulty
- R22: trial-stats.ts
- M3-01: admin-difficulty.ts

### Sprint 8 — Sync + Integrity
- R28: sync.ts (pull-only)
- M4-01/02: admin-integrity.ts + Migration 017

### Sprint 9 — Norms + Analytics
- R34: norms.ts + admin-norms.ts + Migration 018
- M8-01/02: analytics.ts + admin-analytics.ts + Migration 019

### Sprint 10 — AI Pool + Flags
- R14: ai-content-pool.ts + /admin/ai/pool
- M9-01: feature-flags.ts + admin-flags.ts + Migration 020

### Sprint 11 — Budget + Privacy
- R16: ai-usage.ts + /admin/ai/budget + Migration 021
- M12-01/02: privacy.ts + admin-privacy.ts

### Sprint 12 + 13 — Integrity Shadow + Jobs
- R40: integrity-rules.ts (shadow mode) + sessions.ts patch
- M11-03: demo-scripts.ts
- M7-01: job-runner.ts + admin-jobs.ts + Migration 022

### Sprint 14 — Deployment
- Dockerfile + .dockerignore
- render.yaml (blueprint)
- deploy/README.md
- .env.production.example

### Sprint 15 — Retention + Step-up
- R19: retention.ts + admin-retention.ts
- M1-04: step-up.ts (5-min window)

### Sprint 16 — Privacy + Console
- R20: privacy-player.ts + me.ts + Migration 023
- M45: admin-console.ts

### Sprint 17 — Golden + Platform
- R26: scripts/golden-tests.ts
- M13-01: admin-platform.ts

---

## 2. Endpoints (~85)

### Core (10)
GET /health, GET /ready, GET /domains, GET /games, GET /plan, GET /profile, GET /ability, GET /next/:id, GET /decisions, POST /sessions

### Player Auth (4)
POST /auth/otp/request, POST /auth/otp/verify, GET /auth/me, POST /auth/logout

### Plays (2)
POST /plays, POST /plays/consume

### Player Me (2)
GET /me/export, POST /me/erase

### Sync (2)
GET /sync/changes, GET /sync/state

### AI Core (9)
GET /ai/status, POST /ai/generate, POST /ai/chat, GET /ai/conversations, GET /ai/conversations/:id, POST /ai/recap, GET /ai/insights, GET /ai/daily-plan, GET /ai/health

### AI Features (21)
nudge, fingerprint (+regenerate), variants (4), predictions (2), journal (5), voice (2), lab (6), director (4), lessons (4), error-patterns, transfer-tracker

### Admin Auth (8)
POST /admin/auth/login, GET /admin/auth/me, POST /admin/auth/logout, GET /admin/admins, POST /admin/admins/invite, POST /admin/admins/:id/revoke, GET /admin/audit, GET /admin/audit/verify

### Admin AI (3)
GET /admin/ai/health, GET /admin/ai/providers, GET /admin/ai/pool, GET /admin/ai/budget

### Admin Catalog (10)
GET /admin/catalog/games, GET /admin/catalog/games/:id, GET /admin/registry/trial-stats, GET /admin/catalog, GET /admin/catalog/drift, GET /admin/catalog/:id, POST /admin/catalog/sync, POST /admin/catalog/:id/disable, POST /admin/catalog/:id/enable

### Admin Difficulty (3)
GET /admin/difficulty/:gameId, GET /admin/difficulty/calibration

### Admin Integrity (3)
GET /admin/integrity/queue, GET /admin/integrity/sessions/:id, POST /admin/integrity/sessions/:id/review

### Admin Norms (4)
GET /admin/norms, GET /admin/norms/candidates, POST /admin/norms/publish, GET /admin/norms/percentile

### Admin Analytics (3)
GET /admin/analytics/metrics, GET /admin/analytics/funnel, GET /admin/analytics/retention

### Admin Flags (3)
GET /admin/flags, POST /admin/flags/:key, GET /flags/eval

### Admin Privacy (2)
GET /admin/privacy/inventory, GET /admin/privacy/processors

### Admin Demo (7)
GET /admin/demo/origins, POST /admin/demo/users/:id/origin, POST /admin/demo/generate, POST /admin/demo/reset, GET /admin/demo/scripts, POST /admin/demo/scripts, POST /admin/demo/scripts/reset

### Admin Jobs (2)
GET /admin/jobs, POST /admin/jobs/enqueue

### Admin Retention (3)
GET /admin/retention/rules, GET /admin/retention/preview, POST /admin/retention/run

### Admin Console + Platform (3)
GET /admin/console, GET /admin/platform/health, GET /admin/platform/ping

---

## 3. Migrations (23)

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

---

## 4. Database Tables (51)

New in v4:

| Table | Sprint | Purpose |
|---|---|---|
| admin_users | 2 | 5 roles: owner/ops/science/support/analyst |
| admin_audit_log | 2 | Hash-chained audit |
| auth_identities | 3 | provider + subject -> player_id |
| auth_sessions | 3 | Opaque tokens + idle/abs expiry |
| auth_otp_codes | 3 | 6-digit OTP + attempts + expiry |
| session_reviews | 8 | Annotation sidecars (accept/quarantine/invalidate) |
| metric_daily | 9 | Nightly rollups |
| feature_flags | 10 | Kill switches + rollout % |
| ai_provider_usage | 11 | Token + cost ledger |
| job_runs | 12/13 | DB-backed queue (SKIP LOCKED) |
| privacy_requests | 16 | Erasure + export tracking |

---

## 5. Key Services

| Service | Purpose |
|---|---|
| user-lock.ts | Per-user advisory lock (R05) |
| ingestion-validator.ts | Trial plausibility (R07) |
| integrity-rules.ts | Shadow integrity checks (R40) |
| tickets.ts | Single-use play tickets (R06) |
| auth.ts | OTP + sessions (R03) |
| admin-auth.ts | Admin auth + hash-chained audit (M1) |
| step-up.ts | 5-min re-auth window (M1-04) |
| cache.ts | In-memory cache + ETag |
| sanitize.ts | Bidi/zero-width strip (R12) |
| claims-lexicon.ts | L4 + hype filter (M6-03) |
| ai-content-pool.ts | Pool depth report (R14) |
| ai-usage.ts | Token/cost ledger (R16) |
| analytics.ts | Funnel + retention (M8) |
| norms.ts | Candidate + publish (R34) |
| privacy.ts | Data inventory + processors (M12) |
| privacy-player.ts | Export + erase (R20) |
| retention.ts | Retention rules + purge (R19) |
| job-runner.ts | Queue with SKIP LOCKED (M7) |
| demo-scripts.ts | 5 scripted demo users (M11-03) |
| feature-flags.ts | Flags + rollout % (M9-01) |
| trial-stats.ts | Trial size stats (R22) |

---

## 6. Deployment

### Files
- Dockerfile (Node 24 alpine + tini + non-root)
- .dockerignore
- render.yaml (blueprint with env vars)
- deploy/README.md (full guide)
- .env.production.example

### Quick deploy
1. Render Dashboard -> New -> Blueprint -> connect repo
2. Fill secrets: DATABASE_URL, BACKUP_KEY, GROQ_API_KEY, ADMIN_TOKEN
3. Auto-detects render.yaml
4. After deploy: run migrate + seed + admin:setup from Render Shell

### Stack cost ($0)
- Render Free (750h/month)
- Cloudflare Pages (unlimited)
- Neon Free (1GB, 100 CU-hours)
- Groq Free (1000 req/day org-wide)

---

## 7. Test Suite

| File | Purpose | Last |
|---|---|---|
| test.ps1 | Sprint 0 master | ALL PASS |
| test-security.ps1 | 7 security headers | 7/7 |
| test-health.ps1 | /health + /ready | PASS |
| test-catalog.ps1 | ETag + 304 | PASS |
| test-rate-limit.ps1 | X-RateLimit headers | PARTIAL |
| test-r05.mjs | 5 concurrent | PASS |
| scripts/golden-tests.ts | 6 deterministic checks | 6/6 |

Run golden tests: npm run test:golden

---

## 8. Environment Variables

Required:
- DATABASE_URL
- AUTH_SECRET (64-char)
- BACKUP_KEY (32-byte base64)
- ADMIN_TOKEN (32-char hex)

Optional but recommended:
- GROQ_API_KEY (1000 req/day free)
- OPENROUTER_API_KEY (fallback)
- GEMINI_API_KEY (secondary fallback)

---

## 9. Roadmap (Remaining)

| Sprint | Focus | Time |
|---|---|---|
| Done | Sprints 0-17 | 2 days |
| Next | Deploy to Render | 1 hour |
| Later | Frontend Integration | Sprint 18+ |
| Later | Passkey auth (M1-01) | Sprint 19 |
| Later | AI content pool worker | Sprint 20 |
| Later | Full R40 enforcement | Sprint 21 |

---

## 10. Onboarding

    git clone https://github.com/khalid8923/flash.git
    cd backend && npm install
    cp .env.example .env   # fill values
    npm run migrate
    npm run seed && npm run seed:atlas
    npm run admin:setup -- owner@example.com "Name"
    npm run dev
    # Verify: curl http://localhost:3000/health

---

## 11. Golden Rules

- Full files only
- Migration new = new number
- Don't touch 001-023
- UTF-8 no BOM
- Test after every change
- Commit at milestones

---

**Last updated:** 2026-10-09
**Next AI:** Start from Section 9 (Roadmap)
