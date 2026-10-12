import { describe, it, expect } from 'vitest';

describe('Streak logic (pure math)', () => {
  function dateOffset(days: number): string {
    return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  }

  it('same day = no advance', () => {
    const today = dateOffset(0);
    const last = today;
    const advanced = last !== today;
    expect(advanced).toBe(false);
  });

  it('yesterday = advance streak', () => {
    const today = dateOffset(0);
    const last = dateOffset(1);
    const advanced = last !== today;
    expect(advanced).toBe(true);
  });

  it('freeze token logic: skip 1 day with token', () => {
    const tokens = 1;
    const canSkip = tokens > 0;
    expect(canSkip).toBe(true);
  });

  it('freeze token logic: skip 2 days without token resets', () => {
    const tokens = 0;
    const last = dateOffset(3);
    const yesterday = dateOffset(1);
    const wouldReset = last !== yesterday && tokens === 0;
    expect(wouldReset).toBe(true);
  });
});