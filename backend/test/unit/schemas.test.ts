import { describe, it, expect } from 'vitest';
import { SessionSchema } from '../../src/schemas/session.js';

function makeValidSession() {
  return {
    schema_version: 1,
    client_session_id: '0192a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b',
    game_id: 'seq-mem',
    domain_id: 'memory',
    mode: 'classic',
    seed: 'a1b2c3d4e5f60718',
    ticket_id: null,
    started_at: '2026-10-06T14:32:11.000Z',
    ended_at: '2026-10-06T14:33:42.500Z',
    game_version: '1.0.0',
    scoring_version: 1,
    trials: [{
      index: 0,
      stimulus: { digits: [3, 7, 5] },
      response: { entered: [3, 7, 5] },
      rt_ms: 2450,
      correct: true,
      is_practice: false,
    }],
    config: { max_lives: 3, max_level: 15 },
    client_meta: {
      user_agent: 'Test',
      viewport: { w: 1920, h: 1080 },
      device_id: 'test-device',
      device_clock_skew_ms: null,
    },
    source: 'live',
  };
}

describe('SessionSchema', () => {
  it('accepts valid session', () => {
    const r = SessionSchema.safeParse(makeValidSession());
    expect(r.success).toBe(true);
  });

  it('rejects wrong schema_version', () => {
    const s = makeValidSession();
    (s as any).schema_version = 2;
    const r = SessionSchema.safeParse(s);
    expect(r.success).toBe(false);
  });

  it('rejects invalid mode', () => {
    const s = makeValidSession();
    (s as any).mode = 'invalid';
    const r = SessionSchema.safeParse(s);
    expect(r.success).toBe(false);
  });

  it('rejects missing trials', () => {
    const s = makeValidSession();
    (s as any).trials = [];
    const r = SessionSchema.safeParse(s);
    expect(r.success).toBe(false);
  });

  it('rejects invalid source', () => {
    const s = makeValidSession();
    (s as any).source = 'fake';
    const r = SessionSchema.safeParse(s);
    expect(r.success).toBe(false);
  });

  it('accepts all 5 modes', () => {
    for (const mode of ['classic', 'speed', 'endless', 'precision', 'daily']) {
      const s = makeValidSession();
      s.mode = mode;
      expect(SessionSchema.safeParse(s).success).toBe(true);
    }
  });

  it('accepts all 3 sources', () => {
    for (const source of ['live', 'offline', 'legacy_import']) {
      const s = makeValidSession();
      (s as any).source = source;
      expect(SessionSchema.safeParse(s).success).toBe(true);
    }
  });
});