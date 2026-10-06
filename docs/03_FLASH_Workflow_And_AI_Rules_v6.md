# FLASH — 3-Phase Workflow & AI Guidelines (v6.0)

## PART 1: THE 3-PHASE BUILD PROCESS
For every new game, development MUST follow this exact 3-phase sequence. Test after each phase before moving to the next.

### Phase 1 — Infrastructure (3 files)
1. **`{game}-helpers.js`**: Handle Storage, PB (Personal Best), Badges, Missions, and Insights.
2. **`{game}-sounds.js`**: Implement Web Audio API synthesis (Include standard beep, hit, miss, levelUp, and signature chirp).
3. **`{game}-stages.js`**: Define 8 progressive stages.

### Phase 2 — UI (3 files + Dashboard)
1. **`game.html`**: Create HTML structure with the exact 8 script tags in the required order.
2. **`game.css`**: Add game-specific styles at the top + the standard ~450 shared lines at the bottom.
3. **`{game}-extra-modes.js`**: Implement Speed, Endless, Precision, and Daily modes using the game API.
4. **Dashboard Update (`flash-data.js`)**: Change game status to `ready` and add full EN/AR translations.

### Phase 3 — Core (2 files)
1. **`game.js`**: Core game logic (~900-1300 lines). Must expose `window.{Game}API` and `window.{Game}Game`.
2. **`config.json`**: Game metadata documentation.

*(Total time expected per game: ~2-3 hours)*

---

## PART 2: THE 4 EXTRA MODES & 8 STAGES (MANDATORY PER GAME)

### The 4 Extra Modes (`{game}-extra-modes.js`)
Every game MUST support these modes via its API:
1. **Speed:** 15-20 Trials | Short Time | Fast answers.
2. **Endless:** ∞ Trials | Adaptive Time | One mistake = game over.
3. **Precision:** 15 Trials | No time pressure | Max accuracy.
4. **Daily:** 20-30 Trials | Fixed Time | Played once per day.

### The 8 Stages (`{game}-stages.js`)
Every game MUST have these 8 progressive stages:
1. **Apprentice (🥉)** — Reach Level 5
2. **Journeyman (🥈)** — Reach Level 10
3. **Adept (🥇)** — Reach Level 15
4. **Specialist (🎯)** — Game-specific metric requirement
5. **Sprinter (⚡)** — Speed mode challenge
6. **Perfectionist (💎)** — 100% accuracy
7. **Endless Runner (🏃)** — Endless mode Level 6
8. **Master (👑)** — Beat PB with high level

---

## PART 3: RULES FOR THE NEXT AI (NON-NEGOTIABLE)
1. **FULL FILES ONLY:** Always send complete files. NEVER send partial snippets, diffs, or "Ctrl+H" instructions. 
2. **FILE DECLARATION:** State each file with: `Name + Path + Type (🆕 new / ✏️ modified)` before the code block.
3. **ONE GAME AT A TIME:** Never mix files or logic from two different games in the same response.
4. **STRICT SCRIPT ORDER:** Never change the load order of the 8 script tags in `game.html`.
5. **GLOBAL SETTINGS:** Always use `FlashSettings` (from `shared/settings.js`), not per-game settings.
6. **I18N STRICTNESS:** Use `FLASH_I18N.t()` for ALL text. Never hardcode English strings in HTML/JS.
7. **POSTMESSAGE PROTOCOL:** The payload emitted in `game.js` must exactly include the 7 core fields: `type`, `gameId`, `domain`, `mode`, `maxLevel`, `accuracy`, `score`, `medianRT`, `rtv`, `rcs`, `isNewPB`.

---

## PART 4: COMMUNICATION STYLE & USER CONTEXT
- **Language:** Egyptian Arabic mixed with Technical English.
- **Formatting:** Use tables, emojis, and clear structured markdown. No jargon without explanation.
- **The User (باشا البشوات):** The user is a "Vibe Coder" — understands concepts, logic, and architecture perfectly, but relies on you to write the exact, bug-free code. 
- **Pacing:** The user wants fast results and trusts you. When the user says **"اللي بعدو"** (Next), **"كمّل"** (Continue), or **"تمم"** (Done), proceed immediately to the next phase or game.
- **Testing Flow:** Give the code -> User tests locally in browser -> User reports success or sends console logs -> Fix bugs if any -> Move to the next phase.

---

## PART 5: FINAL DIRECTIVE
You are taking over FLASH.
Current state: 31 games ready, 5 remaining.

**Immediate Task Order:**
1. Build `seq-mem` (Memory)
2. Build `argument-analyzer` (Logic)
3. Build `vocabulary-elite` (Language)
4. Build `verbal-analogies` (Language)
5. Build `word-scramble` (Language)

**START YOUR WORK BY:** Acknowledging these instructions, then immediately generating **Phase 1** (helpers, sounds, stages) for `seq-mem` (`frontend/games/memory/seq-mem/`).

END OF HANDOFF v6.0