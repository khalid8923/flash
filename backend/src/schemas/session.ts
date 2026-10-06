import { z } from 'zod';

export const TrialSchema = z.object({
  index: z.number().int().min(0),
  rt_ms: z.number().int().min(0).nullable(),
  correct: z.boolean().nullable(),
  is_practice: z.boolean(),
  stimulus: z.record(z.unknown()),
  response: z.record(z.unknown()),
  phase: z.string().optional(),
  meta: z.record(z.unknown()).optional(),
});

export const SessionSchema = z.object({
  schema_version: z.literal(1),
  client_session_id: z.string().uuid(),
  game_id: z.string().min(1),
  domain_id: z.string().min(1),
  mode: z.enum(['classic', 'speed', 'endless', 'precision', 'daily']),
  seed: z.string().min(8),
  ticket_id: z.string().nullable(),
  started_at: z.string().datetime(),
  ended_at: z.string().datetime(),
  game_version: z.string(),
  scoring_version: z.number().int().min(1),
  trials: z.array(TrialSchema).min(1).max(500),
  config: z.record(z.unknown()),
  client_meta: z.object({
    user_agent: z.string(),
    viewport: z.object({ w: z.number(), h: z.number() }),
    device_id: z.string(),
    device_clock_skew_ms: z.number().nullable(),
  }),
  source: z.enum(['live', 'offline', 'legacy_import']),
});

export type Trial = z.infer<typeof TrialSchema>;
export type Session = z.infer<typeof SessionSchema>;