/* ═══════════════════════════════════════════════════════════
   AI Coach Routes — In-game micro-coach
   Public endpoint — callable mid-session. No auth required.
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { generateNudge } from '../services/ai/nudge.js';

const NudgeBody = z.object({
  trigger: z.enum(['slow_down', 'speed_up', 'tired', 'focus', 'streak_break', 'great_run']),
  game_id: z.string().min(1),
  game_name: z.string().min(1),
  recent_accuracy: z.number().min(0).max(100),
  recent_median_rt_ms: z.number().min(0),
  baseline_accuracy: z.number().min(0).max(100).nullable().optional(),
  baseline_rt_ms: z.number().min(0).nullable().optional(),
  consecutive_mistakes: z.number().int().min(0).default(0),
  session_duration_ms: z.number().int().min(0),
  trials_count: z.number().int().min(0),
  language: z.enum(['en', 'ar']).default('en'),
});

const aiCoachRoutes: FastifyPluginAsync = async (fastify) => {
  /* ═══ In-Game Micro-Coach ═══ */
  fastify.post('/ai/nudge', async (request, reply) => {
    const parsed = NudgeBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'invalid_payload',
        issues: parsed.error.flatten().fieldErrors,
      });
    }
    try {
      const result = await generateNudge(
        {
          trigger: parsed.data.trigger,
          game_id: parsed.data.game_id,
          game_name: parsed.data.game_name,
          recent_accuracy: parsed.data.recent_accuracy,
          recent_median_rt_ms: parsed.data.recent_median_rt_ms,
          baseline_accuracy: parsed.data.baseline_accuracy ?? null,
          baseline_rt_ms: parsed.data.baseline_rt_ms ?? null,
          consecutive_mistakes: parsed.data.consecutive_mistakes,
          session_duration_ms: parsed.data.session_duration_ms,
          trials_count: parsed.data.trials_count,
        },
        parsed.data.language
      );
      return reply.code(200).send(result);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'nudge_failed', message: (err as Error).message });
    }
  });
};

export default aiCoachRoutes;