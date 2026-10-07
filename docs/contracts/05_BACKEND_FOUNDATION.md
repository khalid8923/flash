# FLASH — Backend Foundation (Phase 1)

**Date:** 2026-10-06
**Status:** ✅ Completed

---

## Summary

Fastify server LIVE on port 3000, connected to Neon PostgreSQL with 23 tables
across 5 migrations, seed data loaded (9 domains + 36 games + 15 badges),
and session ingestion endpoint working.

---

## Stack

- Node.js 20+
- Fastify 5.1
- TypeScript 5.6
- PostgreSQL 17 (Neon)
- Zod 3.23

---

## File Structure

backend/
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   └── db.ts
│   ├── routes/
│   │   ├── health.ts
│   │   └── sessions.ts
│   ├── schemas/
│   │   └── session.ts
│   ├── services/
│   │   ├── derive.ts
│   │   ├── users.ts
│   │   ├── pb.ts
│   │   └── badges.ts
│   ├── migrations/
│   │   ├── 001_identity.sql
│   │   ├── 002_catalog.sql
│   │   ├── 003_facts.sql
│   │   ├── 004_derived.sql
│   │   └── 005_ai.sql
│   ├── migrate.ts
│   ├── seed.ts
│   └── server.ts
└── package.json

---

## Endpoints

- GET /health → status + db connection
- POST /sessions → ingest raw trials + derive metrics + PB + badges

---

## Database (23 tables)

Identity: users, devices
Catalog: domains, games, game_domain_weights, badges, norms
Facts: sessions, session_trials
Derived: personal_bests, user_game_stats, domain_scores, user_badges
Sync: user_sync_state, user_settings, play_tickets, integrity_events, import_batches
AI: user_cognitive_profile, ai_recommendation_log, adaptive_difficulty_state, generated_content_cache

---

## Seed Data

- 9 domains
- 36 games
- 36 game-domain weights
- 15 badges (3 tiers × 5 modes)

---

## How to Run

cd D:\Flash\backend
npm install
npm run migrate
npm run seed
npm run dev

Test: curl http://localhost:3000/health

---

## END