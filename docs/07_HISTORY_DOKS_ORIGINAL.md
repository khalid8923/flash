LASH — MASTER PROJECT MEMORY EXPORT (v1.0)
Date: 2026-10-11
Context Window Status: FULL (Transferring to new AI)
Project Root: D:\Flash

1. PROJECT IDENTITY
Name: FLASH
Purpose: Free, science-backed cognitive training platform in the browser. A serious instrument, not a game.
Target Users: Adults 25–45 seeking measurable cognitive progress; students.
Platform: Web (desktop + mobile), PWA, offline-capable.
Languages: English (LTR) + Arabic (RTL) — first-class bilingual support.
Current Stage: Backend ~100% complete. Frontend Dashboard v2 ~90% complete. Integration ~90% complete. 42 games in backend catalog, 42 in frontend.

Main Value Proposition & Differentiators:

100% Free ($0/month infrastructure).

42 games across 10 cognitive domains, all rooted in peer-reviewed academic paradigms.

Generative AI (infinite content, adaptive difficulty).

100% Open Source.

Zero frameworks (No React, no Vue, no build step).

2. COMPLETE DEVELOPMENT HISTORY
2.1 Pre-Chat State
Backend: Fastify 5 + TypeScript + Neon PostgreSQL. 85+ endpoints, 51 tables, 23 migrations. 36 games in catalog. 12 AI features.

Frontend: Monolithic FLASH.html dashboard. 42 game folders (36 core + 6 bonus).

AI: Groq + OpenRouter + Gemini fallback chain.

Contracts: Frozen v1 (Session, Trial, postMessage, Catalog).

2.2 What We Did In This Chat
Phase A: Backend Bonus Games Integration
Added 6 TypeScript files to backend/src/catalog/games/ (flash-cards, truth-tbl, digit-span, mental-math, num-chains, speed-calc).

Updated _meta.ts and registry.ts.

Ran npm run catalog:sync -> 42 games, 630 difficulty levels, 66 domain weights.

Phase B: Dashboard v2 Rebuild (The 13 Phases)
The monolithic FLASH.html was replaced by a modular architecture in frontend/dashboard/.

Phase 1.1 (Scaffold): tokens.css, base.css, layout.css, data.js, i18n.js, core.js, render.js, index.html.

Phase 1.2 (Base Render): 3-column layout (Today, Season, Recent). today.js, season.js, recent.js.

Phase 1.3 (Theme Transition): Circular reveal from the theme toggle button (620ms).

Phase 1.4 (Ambient Motion): Master metronome (8s cycle), sparkline light packets, marching forecast, XP sweep.

Phase 2 (Streak Ring + 3D Brain v1): Day-depletion ring. Interactive brain canvas.

Brain v2 (Anatomical): 1,200 vertex mesh, multi-octave gyri wrinkles, longitudinal fissure, frontal bulge, occipital flattening, cerebellum.

Phase 3 (Split Pane + FLIP + XP): Domain inspector panel, Language FLIP transition, XP particle spray (12 dots).

Phase 4 (Nav + Break + Glow): CTA circular reveal, Lane exit ring, Streak break animation (splits in half), XP proximity glow.

Phase 5 (State + RTL + Mobile): Brain reacts to streak (brightness/rotation). RTL audit (0 hardcoded left/right). Mobile bottom nav.

Phase 6 (Palette + Progress + Heatmap): Cmd+K / / command palette, session progress bar, 7-day activity heatmap.

Phase 7 (Focus + Sound + Export): F key focus mode, Web Audio synthesis, PNG export.

Phase 8 (HUD + Milestone + Compare): Floating session timer, radial ring burst on level-up, domain compare overlay (C key).

Phase 9 (Cleanup + Cheat + Print): Legacy moved to _legacy/. ? cheat sheet. Print CSS.

Phase 10 (PWA + Settings + Sessions): Manifest + Service Worker. Settings drawer (theme, lang, accent, motion, sound). sessions.html archive.

Phase 11 (Domain Brain + Onboarding + IO + Detail): Mini brain in domain hero. 3-step onboarding. Export/import JSON. Session detail modal. Daily reminder notifications.

Phase 12 (Frontend <-> Backend): config.js + api.js. live-data.js fetches /health, /profile, /sessions, /plan and merges into mock data. live-status.js adds a Live/Demo badge.

Phase 13 (Bonus Game: flash-cards): Created 4 files (helpers, sounds, stages, extra-modes), updated game.html and game.js to use shared systems.

3. CURRENT PROJECT STATE
3.1 Completed [CONFIRMED / IMPLEMENTED]
Backend v4.0 (85 endpoints, 51 tables, 23 migrations, 6 bonus games synced).

Dashboard v2 architecture (13 phases completed).

digit-span game (fully integrated).

flash-cards game (fully integrated).

Frontend ↔ Backend integration logic (API client, live loader, fallback).

Git repo initialized, committed (1c62573, 169 files).

3.2 In Progress
Finishing the remaining 4 bonus games (truth-tbl, mental-math, num-chains, speed-calc).

3.3 Blocked / Immediate Issues
Git Push Failed: SSH key exists locally but is not added to GitHub.

README.md Missing: Needs to be created in the root.

CORS Error on file://: The frontend must be served via local HTTP (e.g., npx serve) to talk to the backend. The new AI needs to guide the user to http://localhost:8080.

reminder.js Missing: The file was accidentally not created in Phase 11. (I provided the code in the last messages, but the user might not have pasted it yet).

4. ARCHITECTURE
4.1 High-Level
text
Frontend (Vanilla JS)
  ├── index.html
  ├── domain.html
  └── sessions.html
       ↓ HTTP fetch (localhost:3000)
Backend (Fastify 5 + TypeScript)
  ├── /health, /profile, /sessions, /plan
  ├── /ai/* (Groq, OpenRouter, Gemini)
       ↓ pg pool
Neon PostgreSQL 17 (51 tables)
4.2 Dashboard v2 File Structure (frontend/dashboard/)
text
frontend/dashboard/
├── index.html              Entry point
├── domain.html             Per-domain page
├── sessions.html           Full archive
├── 404.html
├── manifest.webmanifest    PWA manifest
├── sw.js                   Service worker
├── stats.ps1               Dev tool
├── assets/                 Icons
├── css/
│   ├── tokens.css          Design tokens (colors, motion, spacing)
│   ├── base.css            Reset
│   ├── layout.css          Grid
│   ├── panels/             Today, Season, Recent
│   └── modules/            29 files (ambient, brain, pwa, settings, etc.)
└── js/
    ├── config.js           API config
    ├── api.js              Fetch wrapper (timeout, retry, cache)
    ├── data.js             Mock data
    ├── i18n.js             Translations
    ├── core.js             State
    ├── render.js           Orchestrator
    ├── domain-brain.js     Domain hero brain
    └── modules/            30 files (same as CSS modules)
4.3 Design Tokens (tokens.css)
Light Theme (Rose): --bg: #FFF1F2, --pn: #FFFFFF, --tx: #1F2937, --ac: #EC4899.

Dark Theme (Neon): --bg: #000000, --pn: #0A0A0A, --tx: #F0FDF4, --ac: #39FF14.

Domain Colors: Attention #2dd4e0, Spatial #3ddc97, Speed #ffd93d, Memory #9b7bff, Logic #4d8dff, Language #ff9f43, Creativity #ff6ec7, Emotional #ff5a5f, Problem #5aa9ff, Numerical #b6f04a.

Motion: --e-out: cubic-bezier(0.16, 1, 0.3, 1), --e-cine: cubic-bezier(0.76, 0, 0.24, 1), etc.

5. AI SYSTEM & ADAPTIVE ENGINE
Evidence Ladder: L0-L3 allowed, L4 (clinical claims) strictly PROHIBITED.

Difficulty: Weighted staircase + EMA. 10 reason codes (PROMOTE_STABLE, DEMOTE_STRUGGLE, HOLD_IN_BAND, etc.). 540 levels (36 games × 15 levels).

AI Providers: Groq (primary), OpenRouter, Gemini. Circuit breaker (3 failures = 60s cooldown). Validator on all LLM outputs.

6. GAMES (42 Total)
All games follow the 8-file pattern:
config.json, game.html, game.css, game.js, {game}-helpers.js, {game}-sounds.js, {game}-stages.js, {game}-extra-modes.js.

Domain	Games
Attention	flanker, go-no-go, task-switching, vigilance
Spatial	mental-rotation, corsi-blocks, map-memory, block-counter
Speed	reaction, color-match, symbol-sprint, rapid-fire
Memory	n-back, face-match, pattern-recall, seq-mem, flash-cards
Logic	matrix-logic, syllogisms, deduction, argument-analyzer, truth-tbl
Language	lexical-decision, vocabulary-elite, verbal-analogies, word-scramble
Creativity	alternative-uses, creative-connect, story-spark, idea-flow
Emotional	micro-expressions, tone-detector, empathy-engine, social-read
Problem	hanoi, river-crossing, gear-logic, path-finder
Numerical	digit-span, mental-math, num-chains, speed-calc_
7. CRITICAL ERRORS & HOW TO AVOID THEM
CORS on file://: Opening index.html via double-click causes origin 'null' blocked by CORS. Fix: Must serve via npx serve D:\Flash\frontend\dashboard -p 8080 and open http://localhost:8080.

PowerShell Syntax:

Never paste TypeScript/JS directly into PowerShell. Use @' ... '@ here-strings and [System.IO.File]::WriteAllText.

if and else must be on the same line or use } else {.

Arabic text in PowerShell requires $utf8 = New-Object System.Text.UTF8Encoding $false.

Git SSH: The user's SSH key exists at ~/.ssh/id_ed25519.pub but is not added to GitHub. The remote was switched to SSH (git@github.com:khalid8923/flash.git). The user needs to add the SSH key to GitHub settings.

reminder.js Missing: Needs to be created in frontend/dashboard/js/modules/reminder.js.

8. REJECTED IDEAS
Frameworks (React/Vue/Angular): Rejected because the project must run from file:// without a build step.

Tailwind: Rejected due to framework lock-in.

Confetti/Neon Glow: Rejected as "cheap" and wrong register for a scientific tool.

Canvas for charts: SVG is preferred.

Cursor parallax on sparklines: Data should not wobble.

9. IMMEDIATE NEXT STEPS FOR THE NEW AI
Resolve Git Push: Guide the user to add their SSH key to GitHub (https://github.com/settings/ssh/new) and run git push origin main.

Fix Missing Files: Create README.md in the root. Create reminder.js in js/modules/.

Finish Bonus Games: Create the remaining 4 bonus games (truth-tbl, mental-math, num-chains, speed-calc) using the exact same pattern as flash-cards (which was just completed in Phase 13).

Verify Live Data: Ensure the user is running http://localhost:8080 so the Live badge in the header turns green (connects to localhost:3000).

INSTRUCTIONS FOR THE NEXT AI
Read this entire document before making architectural decisions.

Treat CONFIRMED / IMPLEMENTED as established context.

Treat PLANNED as intended work.

Treat REJECTED as rejected unless the user explicitly revisits it.

Never invent missing project information.

Never assume a feature is implemented unless confirmed.

Check the actual project files before claiming implementation details.

Preserve existing decisions unless there is a strong reason to change them.

User Context: The user is a "Vibe Coder" (Egyptian + Technical English). They rely on you to write the exact, bug-free code. Use tables, emojis, and structured Markdown. When the user says "تمم" (Done) or "اللي بعدو" (Next), proceed immediately to the next phase.

PowerShell Rules: Always use [System.IO.File]::WriteAllText with UTF8Encoding $false for writing files. Never use Write-Host for Arabic text as it corrupts the console.