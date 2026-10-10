# AGENTS.md

FLASH — browser-based cognitive training platform. 9 domains (CHC theory), 36 games. No frameworks, no build step; frontend runs from `file://`. Docs are the primary reference and are bilingual (Arabic/English).

## Layout

- `frontend/` — static site. `dashboard/FLASH.html` is the **legacy** dashboard (deployed via Cloudflare Pages from this dir). `games/{domain}/{game-id}/` = 36 games. `shared/` = `i18n.js`, `settings.js`, `flash-stages.js`.
- `backend/` — Fastify 5 + TypeScript (ESM) + Neon Postgres. Self-contained `package.json`. There is **no root package.json**.
- `design-v4/` + `motion-lab/` — new Cortex Reef design prototypes. Currently **untracked** in git (as is the `docs/` restructure). Don't assume they exist on `origin/main`.
- `docs/` — living docs. Read `docs/00_INDEX.md` for the canonical reading order. `docs/02_CONTRACTS/` is **frozen — never edit**. Root `PROJECT_TREE_COMPLETE.md` = file tree reference.

## Backend commands

```powershell
cd D:\Flash\backend
npm run dev        # tsx watch src/server.ts -> http://localhost:3000
npm run typecheck  # tsc --noEmit   (CI gate)
npm run migrate ; npm run seed ; npm run seed:atlas
```

CI (`.github/workflows/ci.yml`): `npm ci` → `npx tsc --noEmit` → `npx tsx scripts/verify-catalog.ts`. Run typecheck after any backend change.

Gotchas:
- ESM strictly: relative imports need explicit `.js` suffix (`verbatimModuleSyntax`).
- Needs `DATABASE_URL` (Neon, `sslmode=require`). Most player endpoints call `getOrCreateDemoUser()` — no auth token needed for `/profile`, `/sessions`, `/plan`, `/ai/*`.
- Global rate limit 200 req/min (only `/health`, `/ready`, `/_internal/*` allow-listed).
- Migrations are numbered (`001…023` in `src/migrations/`). Add a new numbered file; never modify existing ones.
- AI provider chain: Groq → OpenRouter → Gemini → rule fallback. L4 claims (ADHD, IQ, diagnosis) and hype words are banned by the validator.

## Frontend (game) conventions

- Every game = exact 8-file pattern in `frontend/games/{domain}/{game-id}/`; build order is 3-phase (helpers/sounds/stages → html/css/extra-modes → game.js/config.json).
- Script load order in `game.html` is critical and must never change: `shared/i18n.js` → `shared/settings.js` → `shared/flash-stages.js` → `{game}-stages.js` → `{game}-helpers.js` → `{game}-sounds.js` → `{game}-extra-modes.js` → `game.js`.
- All UI text via `FLASH_I18N.t()` (EN + AR). localStorage keys: `flash:lang`, `flash:settings`, `flash:stages:{game}`, `flash:{game}:pb|history|daily|badges|missions`.
- Games report results via `window.parent.postMessage({type:'flash:game-complete', …})`; a domain shell launches games by dispatching the `flash:play` custom event.
- Frontend has no test framework — verify by opening the file in a browser.

## Design system & UI work (read before building UI)

- Product voice: an instrument, "not a game". **No emojis, no confetti, no hype**, editorial typography (system-ui + Iowan Old Style for notes).
- `design-v4/flash-domain.html` is the existing design-system reference: tokens `--mem --spd --att --log --lng --spa --num --pln --flx`, `--mood`, `--dir`, motion vocabulary, RTL + reduced-motion handling.
- `design-v4/flash-cortex-reef.html` is **referenced but does not exist yet** — the Main Dashboard is still to be built there. `motion-lab/dashboard.html` is a rejected canvas prototype.
- RTL convention: `--dir` = 1/-1 via `[dir=rtl]`, offsets use logical properties (`margin-inline-start`, `inset-inline-start`, `transform:scaleX(var(--dir))`). Support `@media (prefers-reduced-motion: reduce)`.
- Do **not** copy from `frontend/dashboard/FLASH.html` (old SaaS-style dashboard: "Cognitive IQ", emojis, Google fonts) — it's what the Cortex Reef design replaces.
- Dashboard data endpoints (dev base `http://localhost:3000`, all take `?language=en|ar`): `GET /profile`, `/sessions`, `/plan`, `/ai/insights`, `/ai/fingerprint`, `/ai/error-patterns`, `/ai/lessons`, `/ai/daily-plan`.

## Working with the owner

- Interacts in Egyptian Arabic + technical English; expects **full files only**, never partial diffs or snippets.
- Verify your work before declaring done; "تمام/تمم" = proceed to next step.
- Writing files containing Arabic from PowerShell: use `[System.IO.File]::WriteAllText(path, content, (New-Object System.Text.UTF8Encoding $false))` — `Write-Host`/console mangles Arabic.
- Never touch the frozen contracts (`docs/02_CONTRACTS/`) or introduce L4 claims.