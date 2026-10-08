/* ═══════════════════════════════════════════════════════════
   AI Variants Routes
   Dynamic game variants (structured rules for frontend to apply)
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  generateVariant,
  listVariants,
  getVariant,
} from '../services/ai/variants/variants.js';
import type { Lang } from '../services/ai/variants/types.js';

const RegenerateBody = z.object({
  game_id: z.string().min(1),
  language: z.enum(['en', 'ar']).default('en'),
});

const aiVariantsRoutes: FastifyPluginAsync = async (fastify) => {
  /* ═══ List all variants for a game ═══ */
  fastify.get<{ Params: { gameId: string }; Querystring: { language?: string } }>(
    '/ai/variants/game/:gameId',
    async (request, reply) => {
      const lang: Lang = request.query.language === 'ar' ? 'ar' : 'en';
      try {
        const items = await listVariants(request.params.gameId, lang);
        return reply.code(200).send({
          game_id: request.params.gameId,
          count: items.length,
          variants: items,
        });
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({
          error: 'variants_list_failed',
          message: (err as Error).message,
        });
      }
    }
  );

  /* ═══ Generate (or return cached) a variant for a game ═══ */
  fastify.get<{ Params: { gameId: string }; Querystring: { language?: string; refresh?: string } }>(
    '/ai/variants/generate/:gameId',
    async (request, reply) => {
      const lang: Lang = request.query.language === 'ar' ? 'ar' : 'en';
      const forceRefresh = request.query.refresh === 'true';
      try {
        const result = await generateVariant(request.params.gameId, lang, forceRefresh);
        return reply.code(200).send(result);
      } catch (err) {
        const msg = (err as Error).message;
        if (msg === 'unknown_game') return reply.code(404).send({ error: msg });
        if (msg === 'no_allowed_axes') return reply.code(422).send({ error: msg });
        request.log.error(err);
        return reply.code(500).send({ error: 'variants_generate_failed', message: msg });
      }
    }
  );

  /* ═══ Force regenerate via POST ═══ */
  fastify.post('/ai/variants/regenerate', async (request, reply) => {
    const parsed = RegenerateBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'invalid_payload',
        issues: parsed.error.flatten().fieldErrors,
      });
    }
    try {
      const result = await generateVariant(
        parsed.data.game_id,
        parsed.data.language,
        true
      );
      return reply.code(200).send(result);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'unknown_game') return reply.code(404).send({ error: msg });
      if (msg === 'no_allowed_axes') return reply.code(422).send({ error: msg });
      request.log.error(err);
      return reply.code(500).send({ error: 'variants_regenerate_failed', message: msg });
    }
  });

  /* ═══ Fetch a single variant by variant_id ═══ */
  fastify.get<{ Params: { variantId: string }; Querystring: { language?: string } }>(
    '/ai/variants/:variantId',
    async (request, reply) => {
      const lang: Lang = request.query.language === 'ar' ? 'ar' : 'en';
      try {
        const result = await getVariant(request.params.variantId, lang);
        if (!result) return reply.code(404).send({ error: 'variant_not_found' });
        return reply.code(200).send(result);
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({
          error: 'variant_fetch_failed',
          message: (err as Error).message,
        });
      }
    }
  );
};

export default aiVariantsRoutes;