# FLASH — postMessage Protocol v1.0

**Status:** Frozen (Locked for v1)
**Date:** 2026-10-06
**Owner:** Shell + Games
**Consumers:** All 36 games

---

## 1. Purpose

Define the strict message contract between:
- **Shell** (host page: dashboard + sync + IndexedDB + network)
- **Game iframe** (sandboxed, stateless, credential-free)

This replaces the legacy "7 core + 4 extended aggregates" protocol.

**Two rules:**
1. Games NEVER compute aggregates. They return raw trials.
2. Games NEVER see cookies, tokens, or localStorage. They get config + seed.

---

## 2. Transport: MessageChannel

We do NOT use `window.parent.postMessage()` for session data.

Instead:
1. Shell creates a private `MessageChannel`.
2. Shell transfers `port2` to the iframe on init.
3. All subsequent messages flow over the private port.

**Why:**
- Sandboxed iframes have `origin: null` — origin-based filtering fails.
- A private port is tied to a specific iframe's `contentWindow` reference.
- Other frames / extensions / tabs can't inject on the port.

---

## 3. Handshake Flow
+---------+ +----------+
| Shell | | Game |
+----+----+ +----+-----+
| |
| 1. Create MessageChannel |
| 2. Load iframe (sandboxed) |
| 3. Wait for 'load' event |
| |
| ---- flash:init (with port2) --------> |
| |
| 4. Set up listener on port1
| 5. Begin game
| |
| <--- flash:ready --------------------- |
| |
| 6. User plays...
| 7. Session ends
| |
| <--- flash:session (trials) ---------- |
| |
| 8. Validate + queue for sync |
| |
| ---- flash:ack ----------------------> |
| |
| 9. Show result, wait for user
| |

text

**Init timeout:** If `flash:ready` not received within 5s -> Shell shows error.

---

## 4. Message Types

### 4.1 Shell -> Game

| Type | When | Payload |
|---|---|---|
| `flash:init` | Once, after iframe load | `{ config, seed, sessionId, ticketId, port2 }` |
| `flash:config` | Mid-game (rare) | `{ key, value }` — runtime config update |
| `flash:abort` | Force stop (e.g. user closes) | `{ reason }` |
| `flash:ack` | After receiving `flash:session` | `{ status, pb, badges, error }` |

### 4.2 Game -> Shell

| Type | When | Payload |
|---|---|---|
| `flash:ready` | After init received | `{ gameVersion }` |
| `flash:session` | Session complete | Full Session object (see SESSION_SCHEMA) |
| `flash:error` | Game-side error | `{ code, message, stack }` |
| `flash:heartbeat` | Every 30s (long sessions) | `{ elapsedMs }` |

---

## 5. Message Shapes

### 5.1 `flash:init` (Shell -> Game)

```json
{
  "type": "flash:init",
  "schema_version": 1,
  "session_id": "0192a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b",
  "game_id": "seq-mem",
  "game_version": "1.0.0",
  "mode": "classic",
  "seed": "f8e7d6c5b4a3928170a1b2c3d4e5f607",
  "ticket_id": "tkt_01HZ...",
  "config": {
    "max_lives": 3,
    "max_level": 15,
    "show_practice": true,
    "difficulty_start": 1
  },
  "user_settings": {
    "soundEnabled": true,
    "soundVolume": 0.7,
    "reducedMotion": false,
    "highContrast": false,
    "lang": "en"
  },
  "port2": "[MessagePort]"
}
Sent via: iframe.contentWindow.postMessage(payload, '*', [port2])

5.2 flash:ready (Game -> Shell)
json
{
  "type": "flash:ready",
  "schema_version": 1,
  "session_id": "0192a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b",
  "game_version": "1.0.0"
}
Sent via: the port (port1 on game side)

5.3 flash:session (Game -> Shell)
Full Session object as defined in SESSION_SCHEMA v1.0.

Key fields:

json
{
  "type": "flash:session",
  "session": { }
}
Constraints:

Payload size <= 256 KB uncompressed

Trials array <= 500 trials

No accuracy, medianRT, rcs, score fields (server derives)

5.4 flash:ack (Shell -> Game)
json
{
  "type": "flash:ack",
  "session_id": "0192a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b",
  "status": "queued",
  "error": null
}
Status values:

queued — accepted locally, will sync when online

synced — already synced (fast path, rare)

rejected — validation failed (game shows "session invalid")

Note: Never reveal WHY it was rejected (anti-cheat reason).

5.5 flash:error (Game -> Shell)
json
{
  "type": "flash:error",
  "code": "INIT_FAILED",
  "message": "Failed to parse seed",
  "stack": "..."
}
5.6 flash:abort (Shell -> Game)
json
{
  "type": "flash:abort",
  "reason": "user_closed"
}
Game must immediately stop, discard current session.

6. Determinism: Seed
Every session has a seed (hex string, >=16 chars).

All randomness must derive from seed:

javascript
// BAD
const idx = Math.floor(Math.random() * options.length);

// GOOD
const rng = seedrandom(seed);
const idx = Math.floor(rng() * options.length);
Recommended: seedrandom.js (tiny, 2KB) or a simple xorshift.

Why this matters:

Server re-derives expected answers from seed

Enables verification: "did the user actually play THIS session?"

Enables replays: same seed = same game

7. Security Rules
Rule	Enforcement
No window.postMessage for session data	Only the private MessageChannel port
Verify event.source === iframe.contentWindow	Shell checks on init
Payload size limit	Shell rejects > 256 KB
Type validation	Shell checks data.type in allowed list
Schema validation	Shell validates against session schema
One session per ticket	Server enforces; shell warns
No cookies/tokens in iframe	Sandboxed without allow-same-origin
CSP strict	Shell sets frame-src 'self'
7.1 Sandbox Attributes
html
<iframe
  sandbox="allow-scripts allow-pointer-lock"
  src="../games/memory/seq-mem/game.html"
  referrerpolicy="no-referrer"
  allow="autoplay; fullscreen"
></iframe>
Note: NO allow-same-origin, NO allow-top-navigation.

8. Timeouts & Errors
Event	Timeout	Action
flash:ready after init	5s	Shell shows error overlay
Session duration	60 min	Server rejects on ingest
Heartbeat gap	90s	Shell may auto-abort
9. Legacy Compatibility (Migration Period)
During the migration from localStorage -> Shell-owned IndexedDB:

Phase A (both work):

New games: use flash:session on port

Old games: still emit flash:game-complete via window.parent.postMessage

Detection: Shell checks if it received flash:ready after init:

If yes -> new protocol

If no after 5s -> assume old game -> allow legacy postMessage path (with feature flag)

Phase B (deprecate legacy):

Set flag FLASH_LEGACY_ENABLED = false

Old games throw error on load

Phase C (remove legacy):

Delete all {game}-helpers.js PB/history logic

Delete all legacy flash:game-complete handlers

10. Example — Full Exchange
javascript
// === SHELL SIDE ===
const iframe = document.getElementById('game-iframe');
const channel = new MessageChannel();

// Set up listener on our end
channel.port1.onmessage = (e) => {
  const msg = e.data;
  if (msg.type === 'flash:ready') {
    console.log('Game ready:', msg.game_version);
  } else if (msg.type === 'flash:session') {
    validateAndQueue(msg.session);
    channel.port1.postMessage({
      type: 'flash:ack',
      session_id: msg.session.client_session_id,
      status: 'queued',
      error: null
    });
  }
};

// Send init
iframe.contentWindow.postMessage({
  type: 'flash:init',
  schema_version: 1,
  session_id: sessionId,
  game_id: 'seq-mem',
  game_version: '1.0.0',
  mode: 'classic',
  seed: 'f8e7d6c5b4a3928170a1b2c3d4e5f607',
  ticket_id: null,
  config: { max_lives: 3, max_level: 15 },
  user_settings: { soundEnabled: true, lang: 'en' }
}, '*', [channel.port2]);
javascript
// === GAME SIDE ===
let port = null;
let sessionCtx = null;

window.addEventListener('message', (e) => {
  if (e.data.type === 'flash:init') {
    port = e.ports[0];
    sessionCtx = e.data;

    port.onmessage = (msg) => {
      if (msg.data.type === 'flash:ack') {
        handleAck(msg.data);
      } else if (msg.data.type === 'flash:abort') {
        abortSession();
      }
    };

    // Signal ready
    port.postMessage({
      type: 'flash:ready',
      schema_version: 1,
      session_id: sessionCtx.session_id,
      game_version: '1.0.0'
    });

    // Start the game with sessionCtx.seed, sessionCtx.config
    startGame(sessionCtx);
  }
});

// On session end:
function endSession(trials) {
  port.postMessage({
    type: 'flash:session',
    session: {
      schema_version: 1,
      client_session_id: sessionCtx.session_id,
      game_id: sessionCtx.game_id,
      domain_id: 'memory',
      mode: sessionCtx.mode,
      seed: sessionCtx.seed,
      ticket_id: sessionCtx.ticket_id,
      started_at: startedAt,
      ended_at: new Date().toISOString(),
      game_version: sessionCtx.game_version,
      scoring_version: 1,
      trials: trials,
      config: sessionCtx.config,
      client_meta: {
        user_agent: navigator.userAgent,
        viewport: { w: window.innerWidth, h: window.innerHeight },
        device_id: sessionCtx.device_id || 'unknown',
        device_clock_skew_ms: null
      },
      source: navigator.onLine ? 'live' : 'offline'
    }
  });
}
11. Error Codes
Code	Meaning
INIT_FAILED	Couldn't parse init payload
SEED_INVALID	Seed missing or malformed
CONFIG_INVALID	Config incompatible with game
SESSION_TOO_LARGE	Trials exceeded 500
RENDER_FAILED	Couldn't render game
UNKNOWN	Catch-all
12. Versioning
schema_version in messages must match SESSION_SCHEMA version

Games declaring wrong version -> server rejects with update_required

Adding new message types -> minor bump, backwards compatible

Changing payload shape -> major bump, breaks old games

13. What Games Must NOT Do
Don't	Do instead
Access localStorage	Get settings from flash:init.user_settings
Access sessionStorage	Use in-memory state
Make fetch() calls	Send flash:session, let Shell handle
Read cookies	Never needed
Use window.parent.postMessage for data	Use the port
Compute accuracy, medianRT, rcs	Send raw trials only
Use Math.random() for stimuli	Use seedrandom(seed)
Load external scripts (CDN)	Bundle all in the 8-file pattern
14. Ready Checklist (Per Game)
Before declaring a game "new-protocol-ready":

□ Listens for flash:init on window
□ Uses e.ports[0] as the port
□ Sends flash:ready after init
□ Uses seedrandom(seed) for all random
□ Records raw trials (no aggregates)
□ Sends flash:session on port (not window.parent)
□ Handles flash:ack and flash:abort
□ No localStorage access anywhere
□ No Math.random() for stimulus generation
□ No fetch / XHR
□ Has a SEED_SCHEMA doc explaining how seed maps to stimuli