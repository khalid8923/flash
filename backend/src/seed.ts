/* ═══════════════════════════════════════════════════════════
   FLASH — Seed Data
   Populates: domains (9), games (36), game_domain_weights, badges (15)
   Idempotent: safe to run multiple times
   ═══════════════════════════════════════════════════════════ */

import { pool, closePool } from './config/db.js';

/* ─── Domains (9) ─── */
const DOMAINS: Array<[string, string, string, string]> = [
  ['attention',  'Attention & Focus',    '👁️', '#2EC4B6'],
  ['spatial',    'Spatial Intelligence', '🗺️', '#5E5CE6'],
  ['speed',      'Speed',                '⚡', '#FF6B35'],
  ['memory',     'Memory',               '🧠', '#00EEFF'],
  ['logic',      'Logic & Reasoning',    '⚙️', '#3A86FF'],
  ['language',   'Language',             '📖', '#9D4EDD'],
  ['creativity', 'Creativity',           '✨', '#FFD60A'],
  ['emotional',  'Emotional IQ',         '❤️', '#FF4D6D'],
  ['problem',    'Problem Solving',      '🧩', '#0FD9B4'],
];

/* ─── Games (36) ─── */
interface GameSeed {
  id: string;
  name: string;
  domain_id: string;
  trial_pattern: string;
  primary_metric: string;
  metric_direction: 'higher' | 'lower';
  rt_floor_ms: number;
  max_trials_per_session: number;
  status?: 'ready' | 'wip';
}

const GAMES: GameSeed[] = [
  /* attention */
  { id: 'flanker',         name: 'Flanker Test',    domain_id: 'attention', trial_pattern: 'multiple_choice', primary_metric: 'flanker_effect_ms', metric_direction: 'lower',  rt_floor_ms: 150, max_trials_per_session: 200 },
  { id: 'go-no-go',        name: 'Go / No-Go',      domain_id: 'attention', trial_pattern: 'go_no_go',         primary_metric: 'd_prime',           metric_direction: 'higher', rt_floor_ms: 100, max_trials_per_session: 300 },
  { id: 'task-switching',  name: 'Task Switching',  domain_id: 'attention', trial_pattern: 'task_switch',      primary_metric: 'switch_cost_ms',    metric_direction: 'lower',  rt_floor_ms: 150, max_trials_per_session: 200 },
  { id: 'vigilance',       name: 'Vigilance',       domain_id: 'attention', trial_pattern: 'go_no_go',         primary_metric: 'd_prime',           metric_direction: 'higher', rt_floor_ms: 100, max_trials_per_session: 500 },

  /* spatial */
  { id: 'mental-rotation', name: 'Mental Rotation', domain_id: 'spatial',   trial_pattern: 'spatial_rotation', primary_metric: 'accuracy',          metric_direction: 'higher', rt_floor_ms: 200, max_trials_per_session: 100 },
  { id: 'corsi-blocks',    name: 'Corsi Blocks',    domain_id: 'spatial',   trial_pattern: 'spatial_click',    primary_metric: 'max_span',          metric_direction: 'higher', rt_floor_ms: 300, max_trials_per_session: 60  },
  { id: 'map-memory',      name: 'Map Memory',      domain_id: 'spatial',   trial_pattern: 'spatial_click',    primary_metric: 'accuracy',          metric_direction: 'higher', rt_floor_ms: 300, max_trials_per_session: 50  },
  { id: 'block-counter',   name: 'Block Counter',   domain_id: 'spatial',   trial_pattern: 'spatial_rotation', primary_metric: 'accuracy',          metric_direction: 'higher', rt_floor_ms: 300, max_trials_per_session: 60  },

  /* speed */
  { id: 'reaction',        name: 'Reaction',        domain_id: 'speed',     trial_pattern: 'simple_rt',        primary_metric: 'median_rt_ms',      metric_direction: 'lower',  rt_floor_ms: 100, max_trials_per_session: 50  },
  { id: 'color-match',     name: 'Color Match',     domain_id: 'speed',     trial_pattern: 'task_switch',      primary_metric: 'stroop_effect_ms',  metric_direction: 'lower',  rt_floor_ms: 150, max_trials_per_session: 200 },
  { id: 'symbol-sprint',   name: 'Symbol Sprint',   domain_id: 'speed',     trial_pattern: 'visual_search',    primary_metric: 'search_slope_ms',   metric_direction: 'lower',  rt_floor_ms: 150, max_trials_per_session: 200 },
  { id: 'rapid-fire',      name: 'Rapid Fire',      domain_id: 'speed',     trial_pattern: 'task_switch',      primary_metric: 'switch_cost_ms',    metric_direction: 'lower',  rt_floor_ms: 150, max_trials_per_session: 200 },

  /* memory */
  { id: 'n-back',          name: 'N-Back',          domain_id: 'memory',    trial_pattern: 'memory_match',     primary_metric: 'max_n_level',       metric_direction: 'higher', rt_floor_ms: 200, max_trials_per_session: 500 },
  { id: 'face-match',      name: 'Face Match',      domain_id: 'memory',    trial_pattern: 'memory_match',     primary_metric: 'accuracy',          metric_direction: 'higher', rt_floor_ms: 300, max_trials_per_session: 60  },
  { id: 'pattern-recall',  name: 'Pattern Recall',  domain_id: 'memory',    trial_pattern: 'spatial_click',    primary_metric: 'max_span',          metric_direction: 'higher', rt_floor_ms: 300, max_trials_per_session: 60  },
  { id: 'seq-mem',         name: 'Seq-Mem',         domain_id: 'memory',    trial_pattern: 'sequence_recall',  primary_metric: 'max_span',          metric_direction: 'higher', rt_floor_ms: 500, max_trials_per_session: 60  },

  /* logic */
  { id: 'matrix-logic',      name: 'Matrix Logic',      domain_id: 'logic', trial_pattern: 'multiple_choice', primary_metric: 'accuracy', metric_direction: 'higher', rt_floor_ms: 300, max_trials_per_session: 60 },
  { id: 'syllogisms',        name: 'Syllogisms',        domain_id: 'logic', trial_pattern: 'multiple_choice', primary_metric: 'accuracy', metric_direction: 'higher', rt_floor_ms: 300, max_trials_per_session: 60 },
  { id: 'deduction',         name: 'Deduction Engine',  domain_id: 'logic', trial_pattern: 'multiple_choice', primary_metric: 'accuracy', metric_direction: 'higher', rt_floor_ms: 300, max_trials_per_session: 60 },
  { id: 'argument-analyzer', name: 'Argument Analyzer', domain_id: 'logic', trial_pattern: 'multiple_choice', primary_metric: 'accuracy', metric_direction: 'higher', rt_floor_ms: 300, max_trials_per_session: 60 },

  /* language */
  { id: 'lexical-decision', name: 'Lexical Decision', domain_id: 'language', trial_pattern: 'multiple_choice', primary_metric: 'priming_effect_ms', metric_direction: 'higher', rt_floor_ms: 200, max_trials_per_session: 200 },
  { id: 'vocabulary-elite', name: 'Vocabulary Elite', domain_id: 'language', trial_pattern: 'multiple_choice', primary_metric: 'accuracy',          metric_direction: 'higher', rt_floor_ms: 300, max_trials_per_session: 60  },
  { id: 'verbal-analogies', name: 'Verbal Analogies', domain_id: 'language', trial_pattern: 'multiple_choice', primary_metric: 'accuracy',          metric_direction: 'higher', rt_floor_ms: 300, max_trials_per_session: 60  },
  { id: 'word-scramble',    name: 'Word Scramble',    domain_id: 'language', trial_pattern: 'free_response',   primary_metric: 'accuracy',          metric_direction: 'higher', rt_floor_ms: 500, max_trials_per_session: 60  },

  /* creativity */
  { id: 'alternative-uses', name: 'Alternative Uses', domain_id: 'creativity', trial_pattern: 'free_response',    primary_metric: 'novelty_score', metric_direction: 'higher', rt_floor_ms: 500, max_trials_per_session: 30 },
  { id: 'creative-connect', name: 'Creative Connect', domain_id: 'creativity', trial_pattern: 'remote_associate', primary_metric: 'accuracy',      metric_direction: 'higher', rt_floor_ms: 300, max_trials_per_session: 60 },
  { id: 'story-spark',      name: 'Story Spark',      domain_id: 'creativity', trial_pattern: 'free_response',    primary_metric: 'novelty_score', metric_direction: 'higher', rt_floor_ms: 500, max_trials_per_session: 30 },
  { id: 'idea-flow',        name: 'Idea Flow',        domain_id: 'creativity', trial_pattern: 'free_response',    primary_metric: 'fluency',       metric_direction: 'higher', rt_floor_ms: 500, max_trials_per_session: 30, status: 'wip' },

  /* emotional */
  { id: 'micro-expressions', name: 'Micro Expressions', domain_id: 'emotional', trial_pattern: 'multiple_choice', primary_metric: 'hard_emotion_accuracy', metric_direction: 'higher', rt_floor_ms: 200, max_trials_per_session: 100 },
  { id: 'tone-detector',     name: 'Tone Detector',     domain_id: 'emotional', trial_pattern: 'multiple_choice', primary_metric: 'accuracy',              metric_direction: 'higher', rt_floor_ms: 300, max_trials_per_session: 60  },
  { id: 'empathy-engine',    name: 'Empathy Engine',    domain_id: 'emotional', trial_pattern: 'multiple_choice', primary_metric: 'accuracy',              metric_direction: 'higher', rt_floor_ms: 300, max_trials_per_session: 60  },
  { id: 'social-read',       name: 'Social Read',       domain_id: 'emotional', trial_pattern: 'multiple_choice', primary_metric: 'accuracy',              metric_direction: 'higher', rt_floor_ms: 300, max_trials_per_session: 60  },

  /* problem */
  { id: 'hanoi',          name: 'Tower of Hanoi', domain_id: 'problem', trial_pattern: 'puzzle_move', primary_metric: 'optimal_move_ratio', metric_direction: 'higher', rt_floor_ms: 500, max_trials_per_session: 200 },
  { id: 'river-crossing', name: 'River Crossing', domain_id: 'problem', trial_pattern: 'puzzle_move', primary_metric: 'optimal_move_ratio', metric_direction: 'higher', rt_floor_ms: 500, max_trials_per_session: 200 },
  { id: 'gear-logic',     name: 'Gear Logic',     domain_id: 'problem', trial_pattern: 'puzzle_move', primary_metric: 'accuracy',           metric_direction: 'higher', rt_floor_ms: 300, max_trials_per_session: 60  },
  { id: 'path-finder',    name: 'Path Finder',    domain_id: 'problem', trial_pattern: 'puzzle_move', primary_metric: 'optimal_path_ratio', metric_direction: 'higher', rt_floor_ms: 300, max_trials_per_session: 100 },
];

/* ─── Badges (15 — 3 tiers × 5 modes) ─── */
interface BadgeSeed {
  id: string;
  name: string;
  tier: 'bronze' | 'silver' | 'gold';
  mode: string;
  threshold: number;
}

const MODES = ['classic', 'speed', 'endless', 'precision', 'daily'];
const TIERS: Array<{ tier: 'bronze' | 'silver' | 'gold'; threshold: number }> = [
  { tier: 'bronze', threshold: 60 },
  { tier: 'silver', threshold: 80 },
  { tier: 'gold',   threshold: 95 },
];

const BADGES: BadgeSeed[] = [];
for (const mode of MODES) {
  for (const { tier, threshold } of TIERS) {
    BADGES.push({
      id: `${mode}-${tier}`,
      name: `${mode[0]!.toUpperCase() + mode.slice(1)} ${tier[0]!.toUpperCase() + tier.slice(1)}`,
      tier,
      mode,
      threshold,
    });
  }
}

/* ─── Seed runner ─── */
async function seed(): Promise<void> {
  console.log('\n🌱 Seeding database...\n');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    /* 1. Domains */
    let domainCount = 0;
    for (const [id, name, icon, color] of DOMAINS) {
      const res = await client.query(
        `INSERT INTO domains (id, name, icon, color)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [id, name, icon, color]
      );
      if (res.rowCount) domainCount++;
    }
    console.log(`  ✅ Domains:  ${domainCount} inserted (${DOMAINS.length} total)`);

    /* 2. Games */
    let gameCount = 0;
    for (const g of GAMES) {
      const res = await client.query(
        `INSERT INTO games
           (id, name, domain_id, trial_pattern, primary_metric, metric_direction,
            rt_floor_ms, max_trials_per_session, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [g.id, g.name, g.domain_id, g.trial_pattern, g.primary_metric,
         g.metric_direction, g.rt_floor_ms, g.max_trials_per_session,
         g.status ?? 'ready']
      );
      if (res.rowCount) gameCount++;
    }
    console.log(`  ✅ Games:    ${gameCount} inserted (${GAMES.length} total)`);

    /* 3. Game-Domain weights (1:1 for now) */
    let weightCount = 0;
    for (const g of GAMES) {
      const res = await client.query(
        `INSERT INTO game_domain_weights (game_id, domain_id, weight)
         VALUES ($1, $2, 1.0)
         ON CONFLICT (game_id, domain_id) DO NOTHING`,
        [g.id, g.domain_id]
      );
      if (res.rowCount) weightCount++;
    }
    console.log(`  ✅ Weights:  ${weightCount} inserted`);

    /* 4. Badges */
    let badgeCount = 0;
    for (const b of BADGES) {
      const rule = {
        scope: 'mode',
        mode: b.mode,
        metric: 'accuracy',
        threshold: b.threshold,
        window: 'session',
      };
      const res = await client.query(
        `INSERT INTO badges (id, name, tier, rule, rule_version)
         VALUES ($1, $2, $3, $4, 1)
         ON CONFLICT (id) DO NOTHING`,
        [b.id, b.name, b.tier, JSON.stringify(rule)]
      );
      if (res.rowCount) badgeCount++;
    }
    console.log(`  ✅ Badges:   ${badgeCount} inserted (${BADGES.length} total)`);

    await client.query('COMMIT');
    console.log('\n✨ Seed complete.\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Seed failed:', (err as Error).message);
    throw err;
  } finally {
    client.release();
    await closePool();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});