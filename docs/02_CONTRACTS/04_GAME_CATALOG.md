# FLASH — Game Catalog v1.0

**Status:** Frozen (Locked for v1)
**Date:** 2026-10-06
**Owner:** Backend + Shell
**Consumers:** Backend derivation engine, Shell validation

---

## 1. Purpose

Per-game metadata that drives:
- Server-side metric computation
- Anti-cheat plausibility checks
- Domain aggregation (profile)
- Trial schema validation

**This file is the single source of truth.** No hardcoded per-game logic in code.

---

## 2. Entry Schema

Each game entry has:

```json
{
  "id": "seq-mem",
  "domain_id": "memory",
  "trial_pattern": "sequence_recall",
  "primary_metric": "max_span",
  "metric_direction": "higher",
  "rt_floor_ms": 500,
  "rt_ceiling_ms": 60000,
  "max_trials_per_session": 60,
  "min_duration_ms": 30000,
  "max_duration_ms": 3600000,
  "max_score": 100000,
  "trial_exclusion_rules": ["practice"],
  "domain_weights": { "memory": 1.0 },
  "scoring_version": 1
}
Field Reference
Field	Meaning
trial_pattern	One of the 9 patterns from TRIAL_SCHEMA §3
primary_metric	The single metric that represents "performance"
metric_direction	higher (higher is better) or lower (lower is better, e.g. RT)
rt_floor_ms	RTs below this are rejected as implausible
rt_ceiling_ms	RTs above this are excluded
max_trials_per_session	Hard cap (reject session if exceeded)
min_duration_ms	Session must last at least this long
max_duration_ms	Hard cap (60 min default)
max_score	Score above this = impossible
trial_exclusion_rules	["practice", "anticipatory", "timeout"]
domain_weights	How much this game loads on each domain
3. Trial Patterns (Recap from TRIAL_SCHEMA)
Pattern ID	Games using it
multiple_choice	vocabulary-elite, verbal-analogies, syllogisms, matrix-logic, deduction, argument-analyzer, tone-detector, social-read, micro-expressions
sequence_recall	seq-mem, digit-span
spatial_click	corsi-blocks, pattern-recall, map-memory
simple_rt	reaction
go_no_go	go-no-go, vigilance
task_switch	task-switching, rapid-fire, color-match
free_response	alternative-uses, idea-flow, story-spark
puzzle_move	hanoi, river-crossing, path-finder, gear-logic
memory_match	face-match, n-back, flash-cards
visual_search	symbol-sprint
spatial_rotation	mental-rotation, block-counter
remote_associate	creative-connect
4. Full Catalog — 36 Games
Domain: attention (4 games)
ID	Trial Pattern	Primary Metric	Direction	RT Floor	Max Trials
flanker	multiple_choice	flanker_effect_ms	lower	150	200
go-no-go	go_no_go	d_prime	higher	100	300
task-switching	task_switch	switch_cost_ms	lower	150	200
vigilance	go_no_go	d_prime	higher	100	500
Domain weights: all load { attention: 1.0 }.

Domain: spatial (4 games)
ID	Trial Pattern	Primary Metric	Direction	RT Floor	Max Trials
mental-rotation	spatial_rotation	accuracy	higher	200	100
corsi-blocks	spatial_click	max_span	higher	300	60
map-memory	spatial_click	accuracy	higher	300	50
block-counter	spatial_rotation	accuracy	higher	300	60
Domain weights: all load { spatial: 1.0 }.

Domain: speed (4 games)
ID	Trial Pattern	Primary Metric	Direction	RT Floor	Max Trials
reaction	simple_rt	median_rt_ms	lower	100	50
color-match	task_switch	stroop_effect_ms	lower	150	200
symbol-sprint	visual_search	search_slope_ms	lower	150	200
rapid-fire	task_switch	switch_cost_ms	lower	150	200
Domain weights: all load { speed: 1.0 }.

Domain: memory (4 games)
ID	Trial Pattern	Primary Metric	Direction	RT Floor	Max Trials
n-back	memory_match	max_n_level	higher	200	500
face-match	memory_match	accuracy	higher	300	60
pattern-recall	spatial_click	max_span	higher	300	60
seq-mem	sequence_recall	max_span	higher	500	60
Domain weights: all load { memory: 1.0 }.

Domain: logic (4 games)
ID	Trial Pattern	Primary Metric	Direction	RT Floor	Max Trials
matrix-logic	multiple_choice	accuracy	higher	300	60
syllogisms	multiple_choice	accuracy	higher	300	60
deduction	multiple_choice	accuracy	higher	300	60
argument-analyzer	multiple_choice	accuracy	higher	300	60
Domain weights: all load { logic: 1.0 }.

Domain: language (4 games)
ID	Trial Pattern	Primary Metric	Direction	RT Floor	Max Trials
lexical-decision	multiple_choice	priming_effect_ms	higher	200	200
vocabulary-elite	multiple_choice	accuracy	higher	300	60
verbal-analogies	multiple_choice	accuracy	higher	300	60
word-scramble	free_response	accuracy	higher	500	60
Domain weights: all load { language: 1.0 }.

Domain: creativity (4 games, 1 WIP)
ID	Trial Pattern	Primary Metric	Direction	RT Floor	Max Trials	Status
alternative-uses	free_response	novelty_score	higher	500	30	ready
creative-connect	remote_associate	accuracy	higher	300	60	ready
story-spark	free_response	novelty_score	higher	500	30	ready
idea-flow	free_response	fluency	higher	500	30	wip
Domain weights: all load { creativity: 1.0 }.

Domain: emotional (4 games)
ID	Trial Pattern	Primary Metric	Direction	RT Floor	Max Trials
micro-expressions	multiple_choice	hard_emotion_accuracy	higher	200	100
tone-detector	multiple_choice	accuracy	higher	300	60
empathy-engine	multiple_choice	accuracy	higher	300	60
social-read	multiple_choice	accuracy	higher	300	60
Domain weights: all load { emotional: 1.0 }.

Domain: problem (4 games)
ID	Trial Pattern	Primary Metric	Direction	RT Floor	Max Trials
hanoi	puzzle_move	optimal_move_ratio	higher	500	200
river-crossing	puzzle_move	optimal_move_ratio	higher	500	200
gear-logic	puzzle_move	accuracy	higher	300	60
path-finder	puzzle_move	optimal_path_ratio	higher	300	100
Domain weights: all load { problem: 1.0 }.

5. Trial Exclusion Rules
Applied during derivation (server-side):

Rule	Meaning
practice	Exclude trials where is_practice: true
anticipatory	Exclude RTs < game's rt_floor_ms
timeout	If rt_ms is null and game scores timeouts as errors, keep as incorrect; otherwise exclude
first_n	Exclude the first N trials (warm-up) — used in some games
6. Scoring Formulas (per primary_metric)
6.1 Accuracy-Based
text
accuracy = (correct_valid_trials / total_valid_trials) * 100
6.2 Speed-Based
text
median_rt_ms = median(rt_ms over correct_valid_trials)
6.3 Rate-Correct Score (RCS)
text
rcs = correct_count / (total_rt_seconds)
6.4 D-Prime (Signal Detection)
text
hit_rate  = hits / (hits + misses)
fa_rate   = false_alarms / (false_alarms + correct_rejections)
d_prime   = z(hit_rate) - z(fa_rate)
6.5 Effect Metrics (Flanker, Stroop, Switch Cost)
text
effect_ms = median_rt(incongruent) - median_rt(congruent)
Lower = better (less interference).

6.6 Priming Effect (Lexical Decision)
text
priming_ms = median_rt(unprimed) - median_rt(primed)
Higher = better (more priming benefit).

6.7 Search Slope (Symbol Sprint)
text
slope = (rt_set_size_8 - rt_set_size_2) / 6
Lower = better (parallel search).

6.8 Max Span
text
max_span = max(sequence_length where correct == true)
7. Example — Full Entry (seq-mem)
json
{
  "id": "seq-mem",
  "domain_id": "memory",
  "trial_pattern": "sequence_recall",
  "primary_metric": "max_span",
  "metric_direction": "higher",
  "rt_floor_ms": 500,
  "rt_ceiling_ms": 60000,
  "max_trials_per_session": 60,
  "min_duration_ms": 30000,
  "max_duration_ms": 3600000,
  "max_score": 100000,
  "trial_exclusion_rules": ["practice"],
  "domain_weights": { "memory": 1.0 },
  "scoring_version": 1
}
8. Seed Schema
Every game must document how its seed drives stimuli.
Example for seq-mem:

text
seed[0:4]  -> number of practice trials
seed[4:8]  -> first level's digit count
seed[8:12] -> RNG offset for digit generation
Server uses this to re-derive expected stimuli during verification.

9. Versioning
scoring_version bumps when formula changes

Sessions carry the version that produced them

Old sessions remain valid; their metrics stay computed with their version

Server may recompute with new version -> bump norms_version

10. Domain Aggregation
javascript
domain_score = sum(weight * confidence * z_score) / sum(weight * confidence)
Where:

weight = domain_weights[domain_id]

confidence = function of session count + consistency

z_score = normalized metric (see SESSION_SCHEMA §A2)