/* ═══════════════════════════════════════════════════════════
   FLASH - Golden Tests (R26)
   Deterministic checks for scoring + adaptive engine.
   Run with: npx tsx scripts/golden-tests.ts
   ═══════════════════════════════════════════════════════════ */

import { deriveMetrics } from '../src/services/derive.js';
import { decideNextLevel } from '../src/services/difficulty/engine.js';

interface Test {
  name: string;
  run: () => Promise<{ ok: boolean; actual: unknown; expected: unknown }>;
}

const tests: Test[] = [
  {
    name: 'deriveMetrics: 100% accuracy, constant RT 1000ms',
    run: async () => {
      const trials = Array.from({ length: 10 }, (_, i) => ({
        index: i, rt_ms: 1000, correct: true, is_practice: false,
        stimulus: {}, response: {},
      }));
      const m = await deriveMetrics('seq-mem', trials as any);
      return {
        ok: m.accuracy === 100 && m.median_rt_ms === 1000 && m.n_correct === 10,
        actual: { acc: m.accuracy, rt: m.median_rt_ms, correct: m.n_correct },
        expected: { acc: 100, rt: 1000, correct: 10 },
      };
    },
  },
  {
    name: 'deriveMetrics: 50% accuracy',
    run: async () => {
      const trials = Array.from({ length: 10 }, (_, i) => ({
        index: i, rt_ms: 800, correct: i % 2 === 0, is_practice: false,
        stimulus: {}, response: {},
      }));
      const m = await deriveMetrics('seq-mem', trials as any);
      return {
        ok: m.accuracy === 50 && m.n_correct === 5,
        actual: { acc: m.accuracy, correct: m.n_correct },
        expected: { acc: 50, correct: 5 },
      };
    },
  },
  {
    name: 'deriveMetrics: practice excluded',
    run: async () => {
      const trials = [
        { index: 0, rt_ms: 500, correct: false, is_practice: true, stimulus: {}, response: {} },
        { index: 1, rt_ms: 800, correct: true, is_practice: false, stimulus: {}, response: {} },
        { index: 2, rt_ms: 900, correct: true, is_practice: false, stimulus: {}, response: {} },
      ];
      const m = await deriveMetrics('seq-mem', trials as any);
      return {
        ok: m.n_trials === 2 && m.accuracy === 100,
        actual: { n: m.n_trials, acc: m.accuracy },
        expected: { n: 2, acc: 100 },
      };
    },
  },
  {
    name: 'decideNextLevel: 90% accuracy 2x in row → PROMOTE',
    run: async () => {
      const ability = {
        ability: 0.5, uncertainty: 0.3, evidence_count: 5,
        current_level: 3, consecutive_successes: 1, consecutive_failures: 0,
        last_session_id: null, last_updated_at: null,
      } as any;
      const d = decideNextLevel(ability, 90, 800);
      return {
        ok: d.to_level === 4 || d.reason_code === 'PROMOTE_STABLE',
        actual: { to: d.to_level, reason: d.reason_code },
        expected: { to: 4, reason: 'PROMOTE_STABLE' },
      };
    },
  },
  {
    name: 'decideNextLevel: 50% accuracy → HOLD or DEMOTE',
    run: async () => {
      const ability = {
        ability: 0.5, uncertainty: 0.3, evidence_count: 5,
        current_level: 5, consecutive_successes: 0, consecutive_failures: 0,
        last_session_id: null, last_updated_at: null,
      } as any;
      const d = decideNextLevel(ability, 50, 1500);
      const ok = d.reason_code === 'DEMOTE_STRUGGLE' || d.reason_code === 'HOLD_IN_BAND';
      return {
        ok,
        actual: { reason: d.reason_code, to: d.to_level },
        expected: { reason: 'DEMOTE_STRUGGLE | HOLD_IN_BAND' },
      };
    },
  },
  {
    name: 'decideNextLevel: bounds 1..15',
    run: async () => {
      const abilityLow = { ability: 0.1, uncertainty: 0.3, evidence_count: 1, current_level: 1, consecutive_successes: 0, consecutive_failures: 3, last_session_id: null, last_updated_at: null } as any;
      const abilityHigh = { ability: 0.95, uncertainty: 0.1, evidence_count: 20, current_level: 15, consecutive_successes: 5, consecutive_failures: 0, last_session_id: null, last_updated_at: null } as any;
      const dLow = decideNextLevel(abilityLow, 20, 3000);
      const dHigh = decideNextLevel(abilityHigh, 99, 400);
      return {
        ok: dLow.to_level >= 1 && dHigh.to_level <= 15,
        actual: { low: dLow.to_level, high: dHigh.to_level },
        expected: { low: '>=1', high: '<=15' },
      };
    },
  },
];

(async () => {
  let pass = 0, fail = 0;
  console.log('\n=== GOLDEN TESTS ===\n');
  for (const t of tests) {
    try {
      const r = await t.run();
      if (r.ok) {
        console.log(`  [PASS] ${t.name}`);
        pass++;
      } else {
        console.log(`  [FAIL] ${t.name}`);
        console.log(`         actual:   ${JSON.stringify(r.actual)}`);
        console.log(`         expected: ${JSON.stringify(r.expected)}`);
        fail++;
      }
    } catch (err) {
      console.log(`  [FAIL] ${t.name} (threw: ${(err as Error).message})`);
      fail++;
    }
  }
  console.log(`\nRESULT: ${pass}/${pass + fail} passed`);
  process.exit(fail === 0 ? 0 : 1);
})();