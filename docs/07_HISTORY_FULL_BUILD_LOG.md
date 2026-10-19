# FLASH — Complete Build Log

**Date**: 2026-10-11
**Author**: Khalid (Founder) + AI collaborators
**Scope**: Everything built, decided, and shipped from the
beginning of this collaboration session to the present moment.

---

## 0. Executive Summary

This document is the single source of truth for what was built,
when, why, and what remains. It covers:

1. The state we inherited
2. The 11 phases of the modular dashboard rebuild
3. The backend bonus games integration
4. Architecture decisions
5. Motion system design
6. What remains

Target reader: the next AI collaborator, a future contributor,
or an investor doing technical due diligence.

---

## 1. Starting Point

### 1.1 Prior State

FLASH already had:

- **Backend**: Fastify 5 + TypeScript 5.6 + Neon PostgreSQL
  - 85+ endpoints
  - 51 database tables
  - 23 migrations
  - 12 AI features
  - 3 AI providers with circuit breaker fallback
- **Frontend Games**: 42 games across 10 domains
  - Each game: 8 files (`config.json`, `game.html`, `game.css`,
    `game.js`, `{game}-helpers.js`, `{game}-sounds.js`,
    `{game}-stages.js`, `{game}-extra-modes.js`)
- **Shared Systems**: `i18n.js`, `settings.js`, `flash-stages.js`
- **Contracts**: 4 frozen schemas in `docs/contracts/`
- **Docs**: 35 files in `docs/`
- **Old Dashboard**: `frontend/dashboard/FLASH.html` — monolithic,
  ~29 KB, hard to extend

### 1.2 Problems To Solve

1. Dashboard was monolithic — extending it required editing a
   single 900-line file
2. Design lacked identity (generic SaaS look)
3. Backend catalog was missing 6 bonus games
4. No PWA, no offline support
5. No unified motion system
6. No 3D hero visual
7. No multi-theme support
8. No settings panel, no data export

---

## 2. The 11 Phases

### Phase 1.1 — Scaffold

**Goal**: Replace the monolithic dashboard with a modular
architecture.

**Files created**:
- `index.html` — new entry point
- `css/tokens.css` — design tokens (colors, spacing, motion)
- `css/base.css` — reset + typography
- `css/layout.css` — fixed viewport + 3-column grid
- `js/data.js` — data layer (domains, sessions, mock state)
- `js/i18n.js` — translation database
- `js/core.js` — state, theme, language, helpers
- `js/render.js` — render orchestrator

**Decisions**:
- Root = `index.html` (old `FLASH.html` preserved as `_legacy`)
- 3 columns: left (Today), center (Season), right (Recent)
- Every feature = one deletable module file
- Motion tokens centralized in `tokens.css`

---

### Phase 1.2 — Base Render

**Goal**: Render the Today panel + Season lanes + Recent table.

**Files created**:
- `css/panels/today.css`, `season.css`, `recent.css`
- `js/modules/today.js` — KPIs + plan
- `js/modules/season.js` — 10 domain lanes with sparklines
- `js/modules/recent.js` — sessions table
- Full `render.js` orchestration

**Features**:
- 10 domains rendered with mock data
- Sparklines drawn as SVG polylines
- Bilingual EN/AR with full RTL
- Theme toggle functional

---

### Phase 1.3 — Theme Transition

**Goal**: Cinematic theme toggle.

**Files created**:
- `css/modules/theme-transition.css`
- `js/modules/theme-transition.js`

**Effect**: Circular reveal from the toggle button center.
Duration 620ms, easing `cubic-bezier(0.76, 0, 0.24, 1)`.

---

### Phase 1.4 — Ambient Motion

**Goal**: Make the dashboard feel alive during a 20-second
reading session.

**Files created**:
- `css/modules/ambient.css`
- `js/modules/ambient.js`

**Features**:
- **Master metronome**: 8-second cycle
- **Sparkline light packets**: 400ms stagger per lane
- **Marching forecast dashes**: linear 6 px/s
- **XP specular sweep**: only when within 10% of next level

**Rejected**:
- Drifting now-line (frames cost with no benefit)
- Cursor parallax on sparklines (data should not wobble)
- Pulse on XP bar (reads as loading state)
- Neon glow everywhere (cheap)

---

### Phase 2 — Streak Ring + 3D Brain + Interactions

**Goal**: Real-time day indicator + anatomical hero visual.

**Files created**:
- `css/modules/streak-ring.css`
- `css/modules/brain.css`
- `css/modules/interactions.css`
- `js/modules/streak-ring.js`
- `js/modules/brain.js`
- Patched `js/modules/today.js` (added brain-wrap + streak-wrap)

**Features**:
- Streak ring depletes through the day (real-time)
- 3D brain v1 with anatomical features
- CTA hover shine, lane hover thicken, theme rotate

---

### Brain v2 — Anatomical Mesh

**Goal**: Replace the blob with a recognisable brain.

**Rewrote** `js/modules/brain.js`:

**Geometry**:
- 40×30 grid = 1,200 vertices
- Multi-octave gyri wrinkles (4 frequencies: 6θ, 11θ, 18θ, 27θ)
- Longitudinal fissure (top 40% only)
- Frontal lobe bulge
- Occipital flattening
- Cerebellum silhouette
- Brainstem extension at the bottom

**Rendering**:
- Depth-sorted edges with alpha falloff
- 60 front-most surface dots pulsing on a 900ms cycle
- Rotation: 84 seconds per full revolution
- 32 FPS capped
- DPR capped at 2

---

### Phase 3 — Split Pane + Language FLIP + XP Gain

**Goal**: Domain inspector, cinematic RTL transition, particle
reward.

**Files created**:
- `css/modules/split-pane.css`
- `css/modules/xp-gain.css`
- `js/modules/split-pane.js`
- `js/modules/lang-flip.js`
- `js/modules/xp-gain.js`

**Features**:
- Click any lane → right-side inspector panel (480px)
- FLIP technique for language switch (480ms total)
- XP count-up (900ms ease-out expo)
- 12 particles sprayed in a 60° cone
- XP bar flash (240ms)

---

### Phase 4 — Navigation + Streak Break + XP Proximity

**Goal**: View transitions, streak break animation, XP glow.

**Files created**:
- `css/modules/navigation.css`
- `css/modules/streak-break.css`
- `js/modules/navigation.js`
- `js/modules/streak-break.js`
- `js/modules/domain-back.js`

**Features**:
- CTA circular reveal (520ms)
- Lane exit + ring + shell fade
- Streak number splits into two halves (crack animation)
- XP proximity glow when within 15% of next level

---

### Phase 5 — Brain State + RTL Audit + Mobile Polish

**Goal**: Reactive brain, RTL correctness, mobile UX.

**Files created**:
- `css/modules/rtl-polish.css`
- `css/modules/mobile.css`
- `js/modules/brain-state.js`
- `js/modules/mobile-nav.js`

**Features**:
- Brain brightness scales with streak (0.35 → 1.0)
- Rotation speed reacts to state
- XP wave travels front → back (700ms)
- RTL audit → 0 hardcoded left/right properties
- Bottom nav for mobile (Today / Season / Log)
- Touch targets ≥ 44px

---

### Phase 6 — Command Palette + Session Progress + Week Heatmap

**Goal**: Power-user navigation + progress indicator + activity
strip.

**Files created**:
- `css/modules/command-palette.css`
- `css/modules/session-progress.css`
- `css/modules/week-heatmap.css`
- `js/modules/command-palette.js`
- `js/modules/session-progress.js`
- `js/modules/week-heatmap.js`

**Features**:
- Cmd+K / Ctrl+K / `/` opens command palette
- Fuzzy search across domains and actions
- Keyboard-first navigation (↑↓ Enter Esc)
- Session progress bar in split pane
- 7-day activity strip in the footer

---

### Phase 7 — Focus Mode + Sound + Export

**Goal**: Immersive mode, subtle audio, PNG snapshot.

**Files created**:
- `css/modules/focus-mode.css`
- `css/modules/export-snapshot.css`
- `js/modules/focus-mode.js`
- `js/modules/sound.js`
- `js/modules/export-snapshot.js`

**Features**:
- `F` key toggles focus mode (hides chrome, expands Season)
- Web Audio feedback (click, hover, success, toggle, error)
- Export the dashboard as a PNG file
- Zero external libraries

---

### Phase 8 — Session HUD + Milestone + Domain Compare

**Goal**: Timer, celebration, side-by-side comparison.

**Files created**:
- `css/modules/session-hud.css`
- `css/modules/milestone.css`
- `css/modules/domain-compare.css`
- `js/modules/session-hud.js`
- `js/modules/milestone.js`
- `js/modules/domain-compare.js`

**Features**:
- Floating session timer with a circular progress ring
- Radial ring burst on level-up (no confetti)
- `C` key opens the compare overlay
- Up to 3 domains side by side
- Diff panel when exactly 2 are selected

---

### Phase 9 — Cleanup + Cheat Sheet + Print

**Goal**: Archive legacy, keyboard help, printable version.

**Files created**:
- `stats.ps1` (dev tool — project statistics)
- `css/modules/cheat-sheet.css`
- `css/modules/print.css`
- `js/modules/cheat-sheet.js`

**Features**:
- Legacy files moved to `_legacy/` (reversible)
- `?` opens the keyboard cheat sheet
- `Ctrl+P` renders a clean printable version

---

### Phase 10 — PWA + Settings + Sessions Page

**Goal**: Installable, configurable, full archive.

**Files created**:
- `manifest.webmanifest`
- `sw.js` (service worker)
- `assets/icon-192.svg`, `assets/icon-512.svg`
- `sessions.html` (full archive page)
- `404.html`
- `css/modules/pwa.css`
- `css/modules/settings-panel.css`
- `js/modules/pwa.js`
- `js/modules/settings-panel.js`

**Features**:
- Installable as a standalone app
- Works offline (cache-first for assets)
- Settings drawer: theme, language, accent (5 options),
  reduced motion, sound, reset
- Full sessions log with search, filter by domain, sortable
  columns

---

### Phase 11 — Domain Brain + Onboarding + Data IO + Session
Detail + Reminder

**Goal**: Polish, first-time UX, portability, detail views.

**Files created**:
- `js/domain-brain.js`
- `css/modules/onboarding.css`
- `css/modules/data-io.css`
- `css/modules/session-detail.css`
- `js/modules/onboarding.js`
- `js/modules/data-io.js`
- `js/modules/session-detail.js`
- `js/modules/reminder.js`

**Features**:
- Mini brain in the domain hero (reuses the mesh)
- 3-step onboarding overlay (dismissed permanently)
- Export / import all `flash.*` keys as JSON
- Session detail modal (accuracy, RT, RTV, RCS, trend)
- Daily reminder notifications (permission + hour picker)

---

## 3. Backend Bonus Games

### 3.1 The 6 Bonus Games

Located in `frontend/games/`:

- `memory/flash-cards`
- `logic/truth-tbl`
- `numerical/digit-span`
- `numerical/mental-math`
- `numerical/num-chains`
- `numerical/speed-calc`

### 3.2 Backend Additions

**Created 6 TypeScript files**:
- `backend/src/catalog/games/flash-cards.ts`
- `backend/src/catalog/games/truth-tbl.ts`
- `backend/src/catalog/games/digit-span.ts`
- `backend/src/catalog/games/mental-math.ts`
- `backend/src/catalog/games/num-chains.ts`
- `backend/src/catalog/games/speed-calc.ts`

**Patched**:
- `backend/src/catalog/_meta.ts` — 6 new entries
- `backend/src/catalog/registry.ts` — 6 imports + 6 list entries

**Result**: `npm run catalog:sync` → 42 games, 630 difficulty
levels, 66 domain weights.

### 3.3 Shared Systems for Bonus Games

**Added to `digit-span`** (pilot):
- `digit-span-helpers.js`
- `digit-span-sounds.js`
- `digit-span-stages.js`
- `digit-span-extra-modes.js`
- Updated `game.html` (8-script pattern)
- Rewrote `game.js` with full integration

**Pending**: Same pattern for the other 5 games.

---

## 4. Architecture

### 4.1 Frontend Dashboard Layout
dashboard/
├── index.html Main entry
├── domain.html Per-domain page
├── sessions.html Full archive
├── 404.html
├── manifest.webmanifest PWA manifest
├── sw.js Service worker
├── stats.ps1 Dev stats tool
├── assets/
│ ├── icon-192.svg
│ └── icon-512.svg
├── css/
│ ├── tokens.css Design tokens
│ ├── base.css Reset + typography
│ ├── layout.css Grid + shell
│ ├── panels/ 3 files
│ └── modules/ 29 files
└── js/
├── data.js Mock data
├── i18n.js Translations
├── core.js State + theme + lang
├── render.js Orchestrator
├── domain-brain.js Domain page brain
└── modules/ 30 files

text

### 4.2 Design Tokens

**Light theme (Rose)**:
- Background: `#FFF1F2`
- Panel: `#FFFFFF`
- Text: `#1F2937`
- Muted: `#9F1239`
- Accent: `#EC4899`

**Dark theme (Neon)**:
- Background: `#000000`
- Panel: `#0A0A0A`
- Text: `#F0FDF4`
- Muted: `#86EFAC`
- Accent: `#39FF14`

**Motion timings**:
- `--t-fast`: 160ms
- `--t-base`: 240ms
- `--t-mid`: 320ms
- `--t-slow`: 480ms
- `--t-grand`: 720ms

**Easing curves**:
- `--e-out`: `cubic-bezier(0.16, 1, 0.3, 1)`
- `--e-in-out`: `cubic-bezier(0.65, 0, 0.35, 1)`
- `--e-spring`: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- `--e-cine`: `cubic-bezier(0.76, 0, 0.24, 1)`

### 4.3 Domain Colors

| Domain | Hex |
|--------|-----|
| Attention | `#2dd4e0` |
| Spatial | `#3ddc97` |
| Speed | `#ffd93d` |
| Memory | `#9b7bff` |
| Logic | `#4d8dff` |
| Language | `#ff9f43` |
| Creativity | `#ff6ec7` |
| Emotional | `#ff5a5f` |
| Problem | `#5aa9ff` |
| Numerical | `#b6f04a` |

### 4.4 Motion System — 5 Principles

1. **Motion earns its place.** Every animation communicates a
   state change.
2. **One metronome.** A single 8-second clock drives all ambient
   motion. Max two things move at once.
3. **Data does not wobble.** Charts are static except for
   state-driven updates.
4. **Reduced motion respected.** Every module checks the media
   query. When triggered, it falls back to a static frame or
   an opacity crossfade.
5. **No decoration.** No confetti, no neon, no ripples.

---

## 5. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `/` | Quick search |
| `?` | Cheat sheet |
| `F` | Focus mode |
| `C` | Compare domains |
| `Cmd/Ctrl + ,` | Settings |
| `Cmd/Ctrl + Shift + L` | Toggle theme |
| `Cmd/Ctrl + Shift + K` | Toggle language |
| `Cmd/Ctrl + Shift + F` | Focus mode |
| `Esc` | Close anything |
| `↑ / ↓` | Navigate lists |
| `Enter` | Run / open |

---

## 6. Accessibility

- **Full RTL support** — audit found zero hardcoded left/right
  properties in the codebase (all use logical properties).
- **Reduced motion** — every module respects
  `prefers-reduced-motion`.
- **High contrast** — theme designed with WCAG AA contrast in
  mind.
- **Keyboard-first** — every interactive element reachable via
  keyboard, every action has a shortcut.
- **Touch targets** — ≥ 44px on mobile.
- **Screen reader** — semantic HTML, `aria-*` attributes where
  needed, `sr-only` utility for visually hidden text.
- **Bilingual** — every string in the DB has EN + AR.

---

## 7. What Remains

### 7.1 Immediate

- [ ] Finish 5 remaining bonus games (helpers, sounds, stages,
      extra-modes files for flash-cards, truth-tbl, mental-math,
      num-chains, speed-calc)
- [ ] Wire the 6 bonus games into the dashboard's game catalog
- [ ] Frontend ↔ Backend integration (fetch real data instead
      of mock)

### 7.2 Short Term

- [ ] Streak freeze tokens (real consumption UI)
- [ ] Daily missions card (3 tasks per day)
- [ ] Badges shelf (12 badges)
- [ ] Achievements notifications
- [ ] Session replay viewer

### 7.3 Medium Term

- [ ] Auth flow (OTP + session) — UI layer
- [ ] Sync push (offline-first)
- [ ] Domain.html full upgrade (games list + AI insights)
- [ ] 3D brain in domain hero (larger, state-reactive)
- [ ] Sound design v2 (subtle background ambient)

### 7.4 Deployment

- [ ] Backend on Render (Dockerfile + render.yaml ready)
- [ ] Frontend on Cloudflare Pages
- [ ] Custom domain + SSL
- [ ] UptimeRobot monitoring
- [ ] Post-deploy smoke tests

### 7.5 Long Term

- [ ] Mobile app (PWA → Tauri or Capacitor)
- [ ] Voice coach integration (Whisper via Groq)
- [ ] Multi-language expansion (FR, ES, DE)
- [ ] Real user analytics dashboard
- [ ] A/B testing framework

---

## 8. Rejected / Avoided

| Idea | Reason |
|------|--------|
| React / Vue / Svelte | Violates the zero-build-step rule |
| Tailwind | Framework lock-in |
| Chart.js / D3 | Adds dependencies |
| Canvas for charts | SVG is enough |
| Confetti | Wrong register for a scientific tool |
| Drifting now-line | Frame cost with no benefit |
| Cursor parallax on sparklines | Data should not wobble |
| Pulse on XP bar | Reads as loading state |
| 26-week heatmap alone | Answers no question |
| Neon glow everywhere | Cheap-looking |
| Letter-scramble for Arabic | Breaks the script's joining |

---

## 9. Non-Negotiable Rules

1. **Vanilla only.** No frameworks. No build step.
2. **Full files only.** No diffs, no partial patches.
3. **Contracts frozen.** Never modify `docs/contracts/`.
4. **Evidence ladder.** L0–L3 allowed, L4 prohibited.
5. **Bilingual by default.** EN + AR with full RTL.
6. **Motion earns its place.**
7. **Modular by design.** Every feature is a deletable file.
8. **Reduced motion respected.**
9. **Zero cost.** All infrastructure on free tiers.
10. **Instrument, not game.** Serious tone, editorial
    typography.

---

## 10. Current Stats

Captured 2026-10-11:

**Frontend dashboard**:
- Files: ~76
- Total size: ~257 KB
- Total lines: ~8,500
- CSS modules: 29
- JS modules: 30
- Panels: 3
- Phases completed: 11

**Whole project** (`D:\Flash`):
- Files: ~660
- Size: ~5.9 MB
- Lines: ~162,000

---

## 11. The Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS. No build step.
- **Backend**: Fastify 5 + TypeScript 5.6 + Node 20+
- **Database**: Neon PostgreSQL 17 (free tier, 1 GB)
- **AI**: Groq (primary) + OpenRouter + Gemini (fallback)
- **Deployment**: Render (backend) + Cloudflare Pages
  (frontend)
- **Cost**: $0/month

---

## 12. Credits

- **Founder**: Khalid
- **Backend + AI architecture**: AI collaborators
- **Dashboard v2 design + build**: This collaboration
- **Motion system research**: Cross-model synthesis
- **Design language**: From Cortex Reef to the current
  modular system

---

## 13. How to Continue

If you are the next AI collaborator:

1. **Read this file first.** Then `README.md` and
   `docs/contracts/`.
2. **Understand the phases.** Each one is modular and
   independent.
3. **Respect the tokens.** Never hardcode colors or durations.
4. **Test in both themes and both languages.** Every time.
5. **Full files only.** No partial patches.
6. **Ask before modifying contracts.**
7. **Check reduced motion.** Every time.
8. **Keep the modules small.** One feature, one file.
9. **Update this file when done.**
10. **Ship.**

---

## 14. Appendix — File Inventory

### Root Files
- `index.html` — Entry point
- `domain.html` — Per-domain page
- `sessions.html` — Full archive
- `404.html` — Not found page
- `manifest.webmanifest` — PWA manifest
- `sw.js` — Service worker
- `stats.ps1` — Statistics tool

### CSS Modules (29)
`ambient`, `brain`, `cheat-sheet`, `command-palette`,
`data-io`, `domain-compare`, `export-snapshot`,
`focus-mode`, `interactions`, `milestone`, `mobile`,
`navigation`, `onboarding`, `print`, `pwa`,
`rtl-polish`, `session-detail`, `session-hud`,
`session-progress`, `settings-panel`, `split-pane`,
`streak-break`, `streak-ring`, `theme-transition`,
`week-heatmap`, `xp-gain`, `ambient` + 2 more.

### JS Modules (30)
`ambient`, `brain`, `brain-state`, `cheat-sheet`,
`command-palette`, `data-io`, `domain-compare`,
`export-snapshot`, `focus-mode`, `lang-flip`,
`milestone`, `mobile-nav`, `navigation`, `onboarding`,
`pwa`, `recent`, `reminder`, `season`, `session-detail`,
`session-hud`, `session-progress`, `settings-panel`,
`sound`, `split-pane`, `streak-break`, `streak-ring`,
`theme-transition`, `today`, `week-heatmap`, `xp-gain`.

### Panels (3)
- `today.css`
- `season.css`
- `recent.css`

---

## END OF BUILD LOG

**Last updated**: 2026-10-11
**Next update**: When Phase 12 completes