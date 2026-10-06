# FLASH — Player Intelligence & AI Strategy v1.0

**Status:** Living Document
**Date:** 2026-10-06
**Owner:** Backend + AI Team
**Depends on:** `05_BACKEND_FOUNDATION.md`, `docs/contracts/*`
**Purpose:** Blueprint for the "brain" of FLASH — adaptive, explainable, safe.

---

## 🎯 PART 0: Philosophy

FLASH is not a collection of 36 games. It is a **cognitive training director**
that learns each player, adapts to them, explains itself, and never lies about
what it knows.

**The best adaptive loop:**
```
Observe → Clean → Estimate → Predict → Select → Explain → Evaluate
```

**Core principles:**
1. **Honesty over hype.** We are not a medical device. We never claim to be.
2. **Explainable by construction.** Every decision has a reason code and a "why."
3. **Player control always wins.** Manual override beats any AI decision.
4. **Safety shield is non-negotiable.** No frustration spirals, no manipulation.
5. **Interpretable models first.** No black boxes in v1.

---

## 🪜 PART 1: The Evidence Ladder

Every signal in FLASH is tagged with one of five levels. This keeps the system
scientifically honest and legally safe.

| Level | What It Is | Example | Shown to Player? |
|---|---|---|---|
| **L0 — Observed** | Logged directly | stimulus, response, timestamp | Yes (history) |
| **L1 — Derived** | Deterministic calculation | accuracy, median RT | Yes |
| **L2 — Estimated** | Statistical estimate with uncertainty | "Memory 7.2 ± 0.6" | Yes, with confidence |
| **L3 — Hypothesized** | Interpretation of a pattern | "dips after ~12 min" | Sparingly, opt-in |
| **L4 — Prohibited** | Clinical conclusion | "ADHD", "brain age 47" | **NEVER** |

### Rules Enforced by the System

- **No L4 generation.** Any output matching clinical patterns is blocked.
- **No comparing to clinical norms.** Player is compared to own history only.
- **Hypotheses require evidence.** L3 statements must cite at least 5 sessions.
- **Sudden drops are mundane until proven otherwise.** "Unusual day?" not "health alert."

### What FLASH MAY Say vs. MUST NOT Say

| Layer | ✅ MAY Say | ❌ MUST NOT Say |
|---|---|---|
| L1 | "Median RT 612ms, accuracy 91%" | — |
| L2 | "Working memory in FLASH tasks: 7.2 ± 0.6" | "Your IQ is 112" |
| L3 | "Accuracy dips after ~12 min (9 sessions)" | "You struggle to concentrate" |
| L4 | — | Any diagnosis, "brain age", "prevents decline" |

---

## 🧠 PART 2: The Player Model

The player is represented as a **hierarchical, uncertainty-aware** model —
not a single "level" number.

### 2.1 Three Clocks

| Clock | Timescale | What It Tracks | Update Rate |
|---|---|---|---|
| **Fast** | seconds–minutes | today's form, momentum, frustration | per round |
| **Trait** | days–weeks | per-game skill, learning rate | per session |
| **Long** | months | trends, plateaus, retention | weekly |

**Key rule:** A bad day changes the session plan immediately but barely moves
the long-term skill estimate. Ability ≠ today's form.

### 2.2 Model Structure

```
Population prior
    ↓
Domain (memory, attention, speed...)
    ↓
Game (seq-mem, flanker...)
    ↓
Sub-skill (ignore distractors at high load)
```

Each level:
- **Borrows strength** from the level above (new game gets domain prior).
- **Has uncertainty** (mean + deviation).
- **Decays** when inactive (uncertainty widens with time away).

### 2.3 What We Store Per Player

| Dimension | Contents | Updated |
|---|---|---|
| Skill per game | ability + uncertainty, difficulty-adjusted | every round |
| Skill per domain | pooled from games, prior for new games | every session |
| Sub-skills | mastery probability | every round |
| Strengths/weaknesses | vs. own average, not peers | every session |
| Volatility | round-to-round swing | weekly |
| Learning rate | curve parameters, plateau flag | every session |
| Rust | decay vs. days away | on return |
| Preference | preferred vs. optimal challenge | every session |
| Consistency | RT CV, spread | every session |
| Fatigue sensitivity | decline slope, recovery | weekly refit |
| Warm-up profile | trials to baseline | every session |
| Error patterns | type mix, recurring confusions | every round |
| Risk & resilience | reaction to failure | per failure |
| Engagement | frequency, motivators, churn risk | daily |

### 2.4 Confidence Tiers

Every estimate has a tier, and **no message may exceed its tier's specificity**:

| Tier | Condition | What We May Say |
|---|---|---|
| **Calibrating** | < 5 valid sessions | "Still learning your baseline" |
| **Provisional** | 5–20 sessions | "Early estimate: 6.1" |
| **Established** | > 20 sessions, consistent | "7.2 ± 0.6" |

---

## ⚙️ PART 3: Adaptive Difficulty Engine

### 3.1 Difficulty Is a Vector

Instead of "level 5", each game exposes **calibrated levers**:

```javascript
difficulty = {
  sequence_length:  3,    // memory load
  time_limit_ms:   2000,  // speed pressure
  distractor_count: 0,    // interference
  stimulus_sim:     0.3,  // similarity of choices
  rule_complexity:  1,    // 1-5
  switching_rate:   0.0,  // 0-1
  novelty:          0.1,  // 0-1
  penalty:          'soft' // soft | medium | hard
}
```

This lets the engine target **specific skills**, not just "harder".

### 3.2 Target Performance Bands

The engine aims for **P(success) ≈ 0.70–0.85** in default training,
varying by mode:

| Mode | Target Success | When Used |
|---|---|---|
| Warm-up | 90–95% | Start of session / after days away |
| Train (default) | 80–85% | Main blocks |
| Stretch | 60–70% | Opt-in / after steady success |
| Recovery | 90% | After failures / quit risk |
| Assess | ~50% (adaptive) | Monthly benchmark |
| Free Play | player decides | Player autonomy |

### 3.3 Decision Cycle

At each decision point, the engine:

1. **Generates candidates** — unlocked games × valid configs
2. **Predicts outcomes** — P(success), expected RT, quit risk
3. **Scores** with weighted utility:
   ```
   U = w₁·learning + w₂·fit + w₃·engagement + w₄·novelty
     + w₅·review − w₆·frustration − w₇·fatigue − w₈·boredom
   ```
4. **Chooses** with bounded exploration (small dither + bandit)
5. **Passes through safety shield**
6. **Logs** decision with reason code

### 3.4 In-Round Micro-Adaptation

- Adapt in **blocks** (every 5–10 trials), never mid-trial
- Prefer **imperceptible** changes (spacing, time window) over visible jumps
- Intervention ladder: `none → nudge → pacing → assist → end → break`
- Cap interventions per session

### 3.5 Hysteresis (Anti Yo-Yo)

- **Demote quickly** after repeated misses at expected-easy levels
- **Promote slowly** — only after evidence across multiple rounds
- **Cap step size** — max 1 level per round, 2 during calibration
- **Cooldown** after each adjustment

**v1 Fallback Rule:** Weighted staircase.
To hold success rate `p`, a miss eases by `p/(1−p)` times the step a hit hardens.
At 80% → a miss eases ~4× as much as a hit hardens.

---

## 🛡️ PART 4: Safety Shield

Hard rules that **no learned policy may override**:

### 4.1 Frustration Cap

- After ~3 consecutive failures → serve easier/recovery round
- Rolling success stays above **55–60%** outside opt-in stretch mode

### 4.2 Player Control

- Manual override always wins
- Adaptation can be turned off
- Competitive play uses **fixed difficulty** tracks

### 4.3 No Manipulation

- Difficulty is **never** tuned to maximize time-in-app
- No punitive streak mechanics
- Suggest breaks after long sessions
- Judge success on **learning + wellbeing**, not just engagement

### 4.4 Fairness

- Correct for device / input latency
- Calibrate assistive settings separately
- Monitor outcomes by device, age band, accessibility use
- Accessibility alternatives for motor/vision/hearing

### 4.5 Privacy

- Collect only what the engine uses
- Player can see / delete / export inferences
- Age-appropriate defaults if minors can play
- Separate identity data from telemetry

### 4.6 Anti-Sandbagging

- Rewards use **difficulty-adjusted** scores from verified sessions
- Flag underperformance inconsistent with own pattern
- Leaderboards on **fixed-difficulty** tracks

### 4.7 Feedback-Loop Protection

- Keep a randomized share of decisions with logged probabilities
- This lets us estimate **what would have happened** under other choices
- Essential for validating the engine without harming users

---

## 🎛️ PART 5: Player-Facing Features

### 5.1 Guidance

- **"Today's Plan"** — time-boxed, warm-up → main → win
- **"Why this level?"** — on every recommendation
- **Difficulty dial** — easier / harder / Chill ↔ Challenge
- **Fixed-difficulty mode**

### 5.2 Insight

- **Cognitive Profile** — with confidence bands, honest states
- **Per-game learning curves**
- **Weekly review** — one insight, one next step
- **Error review** — "your misses cluster on..."
- **Best-time-to-play** (L3, opt-in, evidence shown)

### 5.3 Motivation

- **Forgiving streaks** (weekly goals, freezes)
- **Milestones** tied to difficulty-adjusted performance
- **Optional challenge moments**
- **Winnable finishes** — end on a success
- **Compare to past self** — peers only with explicit opt-in

### 5.4 Trust & Control

- **"What FLASH has inferred about you"** page
- Toggle categories, delete, export
- **Zero clinical vocabulary** anywhere

---

## 🤖 PART 6: AI Layer — 3 Tiers

### Tier 1: Rules + Stats (No LLM)

**Cost:** $0. **Latency:** instant.

| Feature | Technique |
|---|---|
| Difficulty vector | Config + code |
| Session planner | Rule-based |
| Safety shield | Rule-based |
| Cognitive profile | SQL aggregation |
| Reason codes | Enum |
| Warm-up curve | Rolling average |

### Tier 2: LLM-Powered (Free APIs)

**Cost:** $0 via Groq + Gemini. **Latency:** 0.5–2s.

| Feature | Provider | Model |
|---|---|---|
| **AI Coach (Chat)** | Groq | gpt-oss-120b |
| Explanations ("Why?") | Groq | gpt-oss-20b |
| Session Recap | Groq | gpt-oss-120b |
| Weekly Insights | Gemini | Flash (long context) |
| Content Generation | Groq | gpt-oss-120b |
| Translation EN↔AR | Groq | gpt-oss-20b |

**Rules for LLM usage:**
- LLM **only phrases** insights — never generates them from scratch
- Every LLM response passes through an **L4 filter** (blocks health claims)
- Structured facts go in, structured text comes out

### Tier 3: Advanced Modeling (Phase 3+)

**Only after 1000+ users and real data.**

| Feature | Technique |
|---|---|
| Outcome Predictor | IRT-style psychometric |
| Skill Rating | Glicko (value + deviation) |
| Fatigue Curves | Time-series |
| Contextual Bandits | Thompson sampling |
| Retention Model | Spaced repetition (SM-2 variant) |

---

## 🏗️ PART 7: Backend Integration

### 7.1 Data Additions

New tables required (added to existing schema):

| Table | Purpose |
|---|---|
| `difficulty_configs` | Per-game lever catalogs + calibrated difficulty |
| `engine_decisions` | Every decision (mode, reason code, predicted, chosen) |
| `session_plans` | Time-boxed plans per user per day |
| `player_model_snapshots` | Derived, versioned, rebuildable |
| `reason_codes_log` | Audit trail of every reason code emitted |

### 7.2 Game Contract Changes

Every game `init` carries:

```json
{
  "difficulty_config": {
    "sequence_length": 3,
    "time_limit_ms": 2000,
    "distractor_count": 0
  },
  "seed": "...",
  "mode": "train"
}
```

Every game `session` returns:

```json
{
  "served_config": { ... },
  "trials": [ { "difficulty_vector": {...}, ... } ],
  "engine_decision_id": "uuid"
}
```

### 7.3 Where the Engine Runs

| Component | Location | Reason |
|---|---|---|
| In-round decisions | On-device (Shell) | Works offline |
| Between-round | On-device | Instant feedback |
| Model refits | Server | Global data |
| Snapshots | Server → Shell | Pushed on sync |
| Reason code logging | Server | Audit trail |

### 7.4 Integrity

- **Difficulty affects scores** → server must not trust client-claimed config
- Play ticket carries **starting configuration**
- In-round adjustments must be **reproducible** by replaying the rule
- Plausibility checks become **difficulty-aware**
- Offline adaptive sessions stay in the **unverified tier**

---

## 🚀 PART 8: Build Order

### Phase 1 — MVP Foundation (2-3 weeks)

**Deliverable:** Demo that works end-to-end + first AI features.

| # | Task | Time |
|---|---|---|
| 1 | Difficulty Atlas for 3–5 games | 1 day |
| 2 | Log served difficulty on every session | 4h |
| 3 | Weighted staircase + warm-up + caps | 1 day |
| 4 | Per-game ability estimate + uncertainty | 1 day |
| 5 | Reason codes + "Why this level?" | 4h |
| 6 | Session Planner v1 (plan / main / win) | 1 day |
| 7 | AI Coach (Chat) — Groq | 2 days |
| 8 | Session Recap — Groq | 1 day |
| 9 | Safety Shield (frustration cap, recovery mode) | 1 day |
| 10 | Cognitive Profile with confidence tiers | 1 day |
| **Total** | | **~10 days** |

### Phase 2 — Behavior Layer (3-4 weeks)

**Deliverable:** Personality-level personalization.

| # | Task | Time |
|---|---|---|
| 1 | Rapid-guess filtering | 1 day |
| 2 | Post-error + tilt signals | 2 days |
| 3 | Time-on-task curves | 2 days |
| 4 | Session-length + break suggestions | 1 day |
| 5 | Recovery Mode + Stretch Mode | 1 day |
| 6 | Sandbagging checks | 1 day |
| 7 | Weekly Insights — Gemini | 2 days |
| 8 | Adaptive Content for all games | 3 days |
| 9 | Cognitive Profile v2 (IRT-style) | 3 days |
| 10 | User Auth + Cloud Sync | 3 days |
| **Total** | | **~19 days** |

### Phase 3 — Advanced Modeling (3-4 months)

**Deliverable:** Technical moat.

| # | Task |
|---|---|
| IRT predictor with population calibration |
| Glicko-style ratings |
| Ex-Gaussian RT modeling |
| Contextual bandits with logged propensities |
| Simulator of synthetic players |
| A/B testing framework |
| Fairness dashboards |
| Retention studies |

---

## 💰 PART 9: Free Infrastructure

All AI features run on free tiers:

| Service | Free Limit | Used For |
|---|---|---|
| **Groq** | 1000 req/day | Chat, recaps, generation |
| **Gemini AI Studio** | Generous | Weekly insights, long context |
| **OpenRouter** | 50 req/day | Fallback |
| **Neon** | 1GB × 100 projects | PostgreSQL |
| **Render** | 750h/month | Backend hosting |
| **Cloudflare Pages** | Unlimited | Frontend |
| **Resend** | 3000 emails/mo | Auth |

**Total monthly cost: $0** until product-market fit.

---

## 🚫 PART 10: Non-Negotiables

These rules may never be overridden:

1. **No clinical claims.** Ever. In any language.
2. **No hidden adaptation.** Player can always see + change.
3. **No difficulty tuned for time-in-app.**
4. **No speculation beyond confidence tier.**
5. **No peer comparison without opt-in.**
6. **No data sales.**
7. **No L4 (clinical) outputs.** Filtered at every layer.
8. **Manual override > any engine decision.**
9. **Safety shield > learned policy.**
10. **LLM phrases insights; it does not invent them.**

---

## 🧭 PART 11: Success Metrics

### For the Engine Itself

- **Calibration:** predicted vs. actual success rate
- **Challenge fit:** % rounds in target band
- **Stability:** ping-pong rate (level flip-flops)
- **Frustration:** rage-quits, failure streaks
- **Fairness:** parity across subgroups

### For the Player

- **Learning gain** on fixed benchmark rounds
- **Retention** on spaced checks
- **Engagement** (return rate)
- **Wellbeing** (self-reported, optional)

### For the Product

- **Time to first "aha"** moment
- **Session completion rate**
- **30-day retention**
- **Recommendation acceptance rate**

---

## 📎 PART 12: References

- **Evidence Ladder** framework: internal design
- **IRT** (Item Response Theory): psychometric literature
- **Glicko Rating System**: Mark Glickman (1995)
- **Lumosity FTC Settlement (2016)**: cautionary precedent for claims
- **"85% Rule"**: Wilson et al. (2019) on optimal training error

---

## END OF PLAYER INTELLIGENCE STRATEGY v1.0