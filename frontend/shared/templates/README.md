# 🎮 FLASH — Game Template System

## Overview
This template lets you build a fully-featured FLASH game in ~30 minutes.

Every game gets:
- ✅ 4-8 game modes
- ✅ Adaptive difficulty (optional)
- ✅ Stages progression system (8 stages)
- ✅ Personal Best + History + Insights
- ✅ Daily Missions + Badges
- ✅ Sounds + Haptics
- ✅ Settings drawer + Back button
- ✅ Accessibility (Reduced Motion, High Contrast)
- ✅ postMessage to Dashboard

---

## 🚀 Quick Start (30 min)

### Step 1 — Create the folder (2 min)
Copy the game folder structure:

├── config.json
├── game.html
├── game.css
├── game.js
├── {game}-helpers.js
├── {game}-sounds.js
├── {game}-stages.js
└── {game}-extra-modes.js

text

Replace `{domain}` and `{game-id}` with your values.

### Step 2 — Copy templates (2 min)
Copy these 4 files from `shared/templates/`:
- `helpers.template.js` → `{game}-helpers.js`
- `stages.template.js` → `{game}-stages.js`
- `game.template.html` → `game.html`
- `game.template.js` → `game.js`

Copy from `frontend/games/attention/go-no-go/`:
- `gng-sounds.js` → `{game}-sounds.js`
- `gng-extra-modes.js` → `{game}-extra-modes.js` (optional)

### Step 3 — Find & Replace (5 min)
Open each file and replace these placeholders:

| Placeholder | Replace with | Example |
|---|---|---|
| `{{GAME_ID}}` | Game folder ID | `n-back` |
| `{{GAME_NAME}}` | Display name | `N-Back` |
| `{{DOMAIN}}` | Domain ID | `memory` |
| `{{DOMAIN_NAME}}` | Domain name | `Memory` |
| `{{ICON}}` | Emoji icon | `🧠` |
| `{{BRAND_COLOR}}` | Hex color | `#00EEFF` |

### Step 4 — Define stages (5 min)
Open `{game}-stages.js` and fill the STAGES array.
Each stage = `{ id, name, icon, desc, check }`.

Example:
```javascript
{
  id: 'apprentice',
  name: 'Apprentice',
  icon: '🥉',
  desc: 'Reach Level 5',
  check: (s) => s.mode === 'classic' && (s.maxLevel || 0) >= 5
}
Tips:

6-8 stages is ideal

Use medal icons: 🥉 🥈 🥇 👑 🏆 ⭐

The check(s) function receives the session payload

Step 5 — Define main game logic (10 min)
Open game.js and fill these TODO sections:

CONFIG — game-specific settings

generateTrial(level, mode) — return the trial object

handleAnswer(btn) — process user response

showStimulus() — render the trial on screen

endLevel() — evaluate level pass/fail

completeGame() — final stats + insights

Every other function is already done ✅

Step 6 — Customize CSS (5 min)
Open game.css — the "shared" sections are already there.
Add game-specific styles for:

.stimulus-wrap (or whatever shows the trial)

Any custom buttons or layouts

Step 7 — Test (5 min)
Checklist:

□ Menu shows all modes + stages strip
□ Stage 1 pulses as "current"
□ Classic mode plays start → finish
□ Results screen shows PB + badges + insights
□ Back button works in every mode
□ Settings drawer saves preferences
□ Console has no errors
📋 What's Already Done (Don't Touch)
In helpers.js:
✅ Storage (PB, history, daily, badges)

✅ Median/StdDev/RCS calculations

✅ d' (Signal Detection) — optional

✅ Insights generation

✅ History chart rendering

✅ Safe localStorage wrappers

In game.js:
✅ Back button + handleBackClick

✅ Settings drawer (5 options)

✅ Stages integration

✅ Stage strip rendering

✅ Toast notifications

✅ Keyboard bindings (Space, Arrows)

✅ Mount + autoInit

✅ postMessage to dashboard

✅ Sounds + Haptics wiring

✅ All UI helpers (setPhase, render, setTimer, etc.)

In game.css:
✅ Back button styles

✅ Settings drawer styles

✅ Stage strip + toast styles

✅ Badges row styles

✅ PB banner + level-up flash

✅ Feedback flash + progress dots

✅ Timer bar + stats grid

✅ Responsive breakpoints

🎯 What You Customize (Your Job)
1. config.json
json
{
  "id": "{{GAME_ID}}",
  "name": "{{GAME_NAME}}",
  "domain": "{{DOMAIN}}",
  "icon": "{{ICON}}",
  "description": "Short description",
  "difficulty": 3,
  "maxLevel": 15,
  "metrics": ["maxLevel", "accuracy", "medianRT"]
}