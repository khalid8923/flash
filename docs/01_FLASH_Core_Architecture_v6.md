# FLASH — Core Architecture & Shared Systems (v6.0)

## PART 1: WHAT IS FLASH?
**FLASH** is a browser-based cognitive training platform.
- Built strictly with Vanilla HTML/CSS/JS (No frameworks like React or Vue).
- Features 9 cognitive domains (based on CHC theory).
- Designed for 36 total core games (31 currently ready).
- Every game follows a standardized 8-file pattern.
- Scientific paradigms with real academic citations.

---

## PART 2: THE 8-FILE PATTERN (STANDARD)
Every single game must strictly contain these 8 files:
`frontend/games/{domain}/{game-id}/`
1. `config.json` — Metadata (for documentation only).
2. `game.html` — HTML structure + script tags.
3. `game.css` — Specific game styles + shared 450 lines of CSS.
4. `game.js` — Core game logic (~900-1300 lines).
5. `{game}-helpers.js` — Storage, Personal Best (PB), History, Badges, Missions.
6. `{game}-sounds.js` — Web Audio API synthesis.
7. `{game}-stages.js` — 8 progressive stages definitions.
8. `{game}-extra-modes.js` — Speed, Endless, Precision, and Daily modes logic.

### 2.1 Script Order in `game.html` (CRITICAL — NEVER CHANGE)
The loading order of scripts is critical for module dependencies:
1. `../../../shared/i18n.js`
2. `../../../shared/settings.js`
3. `../../../shared/flash-stages.js`
4. `{game}-stages.js`
5. `{game}-helpers.js`
6. `{game}-sounds.js`
7. `{game}-extra-modes.js`
8. `game.js`

---

## PART 3: THE 3-PHASE BUILD PROCESS
For every new game, development must follow this exact sequence:

- **Phase 1 — Infrastructure (3 files):**
  - `{game}-helpers.js`
  - `{game}-sounds.js`
  - `{game}-stages.js`
- **Phase 2 — UI Layer (3 files):**
  - `game.html`
  - `game.css`
  - `{game}-extra-modes.js`
- **Phase 3 — Core Logic (2 files):**
  - `game.js`
  - `config.json`

*(Total time expected per game: ~2-3 hours)*

---

## PART 4: SHARED SYSTEMS (3 INFRASTRUCTURE FILES)
Located in `frontend/shared/`, these files are used by all games:

1. **`shared/i18n.js`** (EN + AR + RTL Support)
   - `FLASH_I18N.t(key, params)`
   - `FLASH_I18N.setLang('en'|'ar')`
   - Contains 200+ translation keys.

2. **`shared/settings.js`** (Global Settings)
   - `FlashSettings.get()` / `set()` / `openPanel()` / `onChange()`
   - Ambient music player logic.
   - Auto-injected Full settings panel UI.

3. **`shared/flash-stages.js`** (Universal Stages System)
   - `FlashStages.init(gameId, stages, opts)`
   - `FlashStages.checkSession(payload)`
   - `FlashStages.renderStrip(container)`

---

## PART 5: STORAGE SCHEMA (`localStorage`)
- `flash:lang` ➔ 'en' | 'ar'
- `flash:settings` ➔ `{ _v: 1, data: {...} }`
- `flash:stages:{game-id}` ➔ Stage progress
- `flash:{game-id}:pb` ➔ Personal best metrics
- `flash:{game-id}:history` ➔ Session history (30 max)
- `flash:{game-id}:daily` ➔ Daily log (90 days)
- `flash:{game-id}:badges` ➔ Unlocked badges
- `flash:{game-id}:missions` ➔ Today's generated missions

---

## PART 6: POSTMESSAGE PROTOCOL
Every game emits a payload to the dashboard when a session is complete. Example:
```javascript
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
  // + game-specific metrics (example below):
  primingEffect: 45,
  nonWordAccuracy: 92
}, '*');
PART 7: DASHBOARD STRUCTURE
FLASH.html — Entry point.

flash.css — ~900 lines of styling.

flash-data.js — Data layer (Domains, Games status, Translations).

flash-charts.js — Canvas charts (Radar chart, Neural BG).

flash-core.js — Core logic + postMessage listener.

Dashboard Features: 9 domain tabs, Game cards with READY/WIP badges, Cognitive radar chart, Global settings panel, EN/AR toggle, Dark/Light theme.

PART 8: THE 4 EXTRA MODES (Per Game)
Every game has 4 additional modes beyond Classic:

Speed: 15-20 Trials | Short Time | Feature: Fast answers.

Endless: ∞ Trials | Adaptive Time | Feature: One mistake = game over.

Precision: 15 Trials | No pressure | Feature: Max accuracy focus.

Daily: 20-30 Trials | Fixed Time | Feature: Played once per day.

PART 9: THE 8 STAGES (Per Game)
Every game has 8 progressive stages to unlock:

Apprentice (🥉) — Reach Level 5

Journeyman (🥈) — Reach Level 10

Adept (🥇) — Reach Level 15

Specialist (🎯) — Game-specific metric requirement

Sprinter (⚡) — Speed mode challenge

Perfectionist (💎) — 100% accuracy

Endless Runner (🏃) — Endless mode Level 6

Master (👑) — Beat PB with high level

PART 10: QUICK REFERENCE COMMANDS
Create new game folder (PowerShell):

PowerShell
mkdir "D:\Flash\frontend\games\{domain}\{game-id}" -Force
cd "D:\Flash\frontend\games\{domain}\{game-id}"
New-Item -ItemType File -Force config.json, game.html, game.css, game.js, `
  {game-id}-helpers.js, {game-id}-sounds.js, {game-id}-stages.js, {game-id}-extra-modes.js
Open dashboard: Open D:\Flash\frontend\dashboard\FLASH.html
Test a single game: Open D:\Flash\frontend\games\{domain}\{game-id}\game.html