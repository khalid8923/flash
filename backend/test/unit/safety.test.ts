import { describe, it, expect } from 'vitest';
import { validateAiText } from '../../src/services/ai/validator.js';

describe('AI safety — L4 clinical claims', () => {
  const cases: Array<[string, boolean]> = [
    ['You have ADHD', true],
    ['This is a diagnosis', true],
    ['Clinical treatment needed', true],
    ['Boost your brain', true],
    ['This is a miracle', true],
    ['You improved 45ms', false],
    ['Your accuracy rose to 91%', false],
    ['Keep your routine steady', false],
  ];

  for (const [text, shouldBlock] of cases) {
    it(`${shouldBlock ? 'blocks' : 'allows'}: "${text}"`, () => {
      const r = validateAiText(text, { minLen: 3 });
      expect(r.ok).toBe(!shouldBlock);
    });
  }
});

describe('AI safety — Arabic', () => {
  it('blocks AR clinical terms', () => {
    const r = validateAiText('هذا تشخيص طبي لحالتك', { minLen: 5 });
    expect(r.ok).toBe(false);
  });

  it('blocks AR hype', () => {
    const r = validateAiText('هذا عبقري ومعجزة', { minLen: 5 });
    expect(r.ok).toBe(false);
  });

  it('allows benign Arabic', () => {
    const r = validateAiText('تحسّنت دقتك هذا الأسبوع', { minLen: 5 });
    expect(r.ok).toBe(true);
  });
});

describe('AI safety — Fact sheet echo', () => {
  it('blocks 4+ key:value lines', () => {
    const NL = String.fromCharCode(10);
    const lines = [
      'accuracy: 87',
      'median: 412',
      'maxLevel: 12',
      'rcs: 12.4',
      'You did well this session.',
    ];
    const text = lines.join(NL);
    const r = validateAiText(text, { minLen: 10 });
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.code === 'fact_sheet_echo')).toBe(true);
  });

  it('allows 3 or fewer key:value lines', () => {
    const NL = String.fromCharCode(10);
    const text = 'accuracy: 87' + NL + 'median: 412' + NL + 'You did well.';
    const r = validateAiText(text, { minLen: 5 });
    expect(r.ok).toBe(true);
  });
});