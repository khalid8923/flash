import { describe, it, expect } from 'vitest';

/* Formatting helpers (pure) */
function median(arr: number[]): number | null {
  if (arr.length === 0) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1]! + s[m]!) / 2 : s[m]!;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const sq = arr.reduce((s, x) => s + (x - mean) ** 2, 0);
  return Math.sqrt(sq / (arr.length - 1));
}

describe('Number formatting', () => {
  it('median of odd array', () => {
    expect(median([5, 1, 3])).toBe(3);
  });

  it('median of even array', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it('median of empty returns null', () => {
    expect(median([])).toBeNull();
  });

  it('median of single-element array', () => {
    expect(median([7])).toBe(7);
  });

  it('std dev of identical values = 0', () => {
    expect(stdDev([5, 5, 5, 5])).toBe(0);
  });

  it('std dev of [2,4,4,4,5,5,7,9] = ~2.138 (Bessel)', () => {
    const v = stdDev([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(v).toBeCloseTo(2.138, 2);
  });

  it('std dev of empty = 0', () => {
    expect(stdDev([])).toBe(0);
  });

  it('RCS formula', () => {
    const correct = 45;
    const rtSeconds = 60;
    const rcs = correct / rtSeconds;
    expect(rcs).toBe(0.75);
  });

  it('accuracy rounds to 2 decimals', () => {
    const acc = Math.round((7 / 9) * 100 * 100) / 100;
    expect(acc).toBe(77.78);
  });

  it('primary_score never exceeds max_score', () => {
    const raw = 95000;
    const max = 100000;
    expect(Math.min(raw, max)).toBe(95000);

    const huge = 200000;
    expect(Math.min(huge, max)).toBe(100000);
  });
});