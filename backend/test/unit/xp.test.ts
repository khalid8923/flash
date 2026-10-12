import { describe, it, expect } from 'vitest';

describe('XP math (pure logic)', () => {
  function xpForLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  it('level 1 needs 100 XP', () => {
    expect(xpForLevel(1)).toBe(100);
  });

  it('level 2 needs 150 XP', () => {
    expect(xpForLevel(2)).toBe(150);
  });

  it('level 5 needs ~506 XP', () => {
    expect(xpForLevel(5)).toBe(506);
  });

  it('multi-level up calculation', () => {
    let total = 0;
    let level = 1;
    let gained = 0;
    const award = 300;
    total += award;
    while (total >= xpForLevel(level)) {
      total -= xpForLevel(level);
      level++;
      gained++;
    }
    expect(gained).toBe(2);
    expect(level).toBe(3);
    expect(total).toBe(50);
  });
});