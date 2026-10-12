import { describe, it, expect } from 'vitest';

/* Pure math reimplementation of engine decision logic */
const MIN_LEVEL = 1;
const MAX_LEVEL = 15;
const PROMOTE_THRESHOLD = 85;
const DEMOTE_THRESHOLD = 60;
const PROMOTE_NEEDED = 2;
const FRUSTRATION_CAP = 3;

interface Ability {
  current_level: number;
  consecutive_successes: number;
  consecutive_failures: number;
}

function decideNextLevel(current: Ability, accuracy: number) {
  const from = current.current_level;
  if (current.consecutive_failures >= FRUSTRATION_CAP) {
    return { from, to: Math.max(MIN_LEVEL, from - 1), reason: 'HOLD_FRUSTRATION' };
  }
  if (accuracy < DEMOTE_THRESHOLD) {
    return { from, to: Math.max(MIN_LEVEL, from - 1), reason: 'DEMOTE_STRUGGLE' };
  }
  if (accuracy >= PROMOTE_THRESHOLD) {
    const streak = current.consecutive_successes + 1;
    if (streak >= PROMOTE_NEEDED && from < MAX_LEVEL) {
      return { from, to: Math.min(MAX_LEVEL, from + 1), reason: 'PROMOTE_STABLE' };
    }
    return { from, to: from, reason: 'HOLD_IN_BAND' };
  }
  return { from, to: from, reason: 'HOLD_IN_BAND' };
}

function emaUpdate(old: number, accuracy: number, evidence: number): number {
  const alpha = Math.max(0.15, 1 / Math.max(3, evidence));
  return old * (1 - alpha) + (accuracy / 100) * alpha;
}

describe('Adaptive engine math', () => {
  it('promotes on 2 consecutive 85%+', () => {
    const a = { current_level: 5, consecutive_successes: 1, consecutive_failures: 0 };
    const d = decideNextLevel(a, 90);
    expect(d.reason).toBe('PROMOTE_STABLE');
    expect(d.to).toBe(6);
  });

  it('holds on first 90% (needs streak)', () => {
    const a = { current_level: 5, consecutive_successes: 0, consecutive_failures: 0 };
    const d = decideNextLevel(a, 90);
    expect(d.reason).toBe('HOLD_IN_BAND');
    expect(d.to).toBe(5);
  });

  it('demotes immediately on <60%', () => {
    const a = { current_level: 5, consecutive_successes: 0, consecutive_failures: 0 };
    const d = decideNextLevel(a, 40);
    expect(d.reason).toBe('DEMOTE_STRUGGLE');
    expect(d.to).toBe(4);
  });

  it('holds + recovers on 3+ failures', () => {
    const a = { current_level: 5, consecutive_successes: 0, consecutive_failures: 3 };
    const d = decideNextLevel(a, 95);
    expect(d.reason).toBe('HOLD_FRUSTRATION');
  });

  it('never goes below MIN_LEVEL', () => {
    const a = { current_level: 1, consecutive_successes: 0, consecutive_failures: 0 };
    const d = decideNextLevel(a, 10);
    expect(d.to).toBe(1);
  });

  it('never goes above MAX_LEVEL', () => {
    const a = { current_level: 15, consecutive_successes: 5, consecutive_failures: 0 };
    const d = decideNextLevel(a, 100);
    expect(d.to).toBe(15);
  });

  it('EMA: first session moves toward high accuracy', () => {
    /* alpha = 1/3 → new = 0.30*0.667 + 1.0*0.333 = 0.533 */
    const old = 0.30;
    const next = emaUpdate(old, 100, 0);
    expect(next).toBeGreaterThan(0.5);
    expect(next).toBeLessThan(0.6);
  });

  it('EMA: after many sessions, small but nonzero change', () => {
    /* alpha floor = 0.15 → new = 0.75*0.85 + 1.0*0.15 = 0.7875 */
    const old = 0.75;
    const next = emaUpdate(old, 100, 100);
    const delta = Math.abs(next - old);
    expect(delta).toBeLessThan(0.05);
    expect(delta).toBeGreaterThan(0.01);
  });

  it('EMA: alpha never below 0.15', () => {
    const old = 0.5;
    const next = emaUpdate(old, 1, 1000);
    expect(next).toBeLessThan(0.5);
    expect(next).toBeGreaterThan(0.4);
  });

  it('EMA: accuracy decrease pushes estimate down', () => {
    const old = 0.8;
    const next = emaUpdate(old, 20, 5);
    expect(next).toBeLessThan(old);
  });
});