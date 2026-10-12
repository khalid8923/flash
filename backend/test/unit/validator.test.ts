import { describe, it, expect } from 'vitest';
import { validateAiText, validateGeneratedShape } from '../../src/services/ai/validator.js';

describe('ai validator', () => {
  it('passes clean text', () => {
    const r = validateAiText('You improved your median reaction time by 45ms this week.', { minLen: 10 });
    expect(r.ok).toBe(true);
  });

  it('blocks L4 clinical claims (EN)', () => {
    const r = validateAiText('This diagnosis confirms your ADHD treatment needs.', { minLen: 10 });
    expect(r.ok).toBe(false);
    expect(r.issues.some(i => i.code === 'l4_violation')).toBe(true);
  });

  it('blocks L4 clinical claims (AR)', () => {
    const r = validateAiText('هذا تشخيص طبي لحالتك', { minLen: 5 });
    expect(r.ok).toBe(false);
  });

  it('blocks hype words', () => {
    const r = validateAiText('This is a miracle to boost your brain power!', { minLen: 10 });
    expect(r.ok).toBe(false);
    expect(r.issues.some(i => i.code === 'hype_violation')).toBe(true);
  });

  it('validates shape with missing field', () => {
    const r = validateGeneratedShape({ a: 1 }, ['a', 'b']);
    expect(r.ok).toBe(false);
    expect(r.issues[0].code).toBe('missing_field');
  });
});