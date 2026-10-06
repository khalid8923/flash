import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { generateContent } from '../services/ai/generate.js';
import { listGenerativeGames } from '../services/ai/prompts.js';
import { groq } from '../services/ai/groq-client.js';

const GenerateBody = z.object({
  game_id: z.string().min(1),
  difficulty: z.number().int().min(1).max(10),
  language: z.enum(['en', 'ar']).default('en'),
  exclude: z.array(z.string()).default([]),
  bypass_cache: z.boolean().default(false),
});

const aiRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/ai/status', async () => {
    return {
      enabled: groq.isEnabled(),
      provider: 'groq',
      generative_games: listGenerativeGames(),
    };
  });

  fastify.post('/ai/generate', async (request, reply) => {
    const parsed = GenerateBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'invalid_payload',
        issues: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const result = await generateContent({
        gameId: parsed.data.game_id,
        difficulty: parsed.data.difficulty,
        language: parsed.data.language,
        exclude: parsed.data.exclude,
        bypassCache: parsed.data.bypass_cache,
      });
      return reply.code(200).send(result);
    } catch (err) {
      request.log.error(err);
      const msg = (err as Error).message;
      if (msg.includes('does not support')) {
        return reply.code(400).send({ error: 'unsupported_game', message: msg });
      }
      if (msg.includes('not configured')) {
        return reply.code(503).send({ error: 'ai_not_configured', message: msg });
      }
      return reply.code(500).send({ error: 'generation_failed', message: msg });
    }
  });
};

export default aiRoutes;