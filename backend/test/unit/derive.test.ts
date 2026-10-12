import { describe, it, expect } from 'vitest';

describe('derive logic (pure math)', () => {
  function median(arr: number[]): number | null {
    if (arr.length === 0) return null;
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 === 0 ? (s[m - 1]! + s[m]!) / 2 : s[m]!;
  }

  it('computes median of odd array', () => {
    expect(median([1, 3, 5])).toBe(3);
  });

  it('computes median of even array', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it('returns null for empty array', () => {
    expect(median([])).toBeNull();
  });

  it('accuracy calculation', () => {
    const correct = 8;
    const total = 10;
    const accuracy = (correct / total) * 100;
    expect(accuracy).toBe(80);
  });

  it('RCS calculation', () => {
    const correct = 10;
    const totalRtSeconds = 5.2;
    const rcs = correct / totalRtSeconds;
    expect(rcs).toBeCloseTo(1.923, 2);
  });
});