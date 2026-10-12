/* ═══════════════════════════════════════════════════════════
   Director Mode Routes
   AI manages a full session (start → checkpoints → end)
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getOrCreateDemoUser } from '../../services/users.js';
import {
  loadDirectorContext,
  loadScriptCandidates,
  generateScript,
  decideNextRound,
  generateFinalSummary,
} from '../../services/ai/director/decider.js';
import {
  createDirectorSession,
  getDirectorSession,
  appendCheckpoint,
  markSessionEnded,
} from '../../services/ai/director/session.js';
import type {
  Lang,
  DirectorContext,
  DirectorCheckpoint,
  DirectorRoundResult,
} from '../../services/ai/director/types.js';

/* ─── Request schemas ─── */

const StartBody = z.object({
  language: z.enum(['en', 'ar']).default('en'),
});

const CheckpointBody = z.object({
  round_number: z.number().int().min(1).max(10),
  game_id: z.string().min(1),
  accuracy: z.number().min(0).max(100),
  median_rt_ms: z.number().min(0),
  level_reached: z.number().int().min(1).max(15),
  duration_ms: z.number().int().min(0),
  user_feedback: z.enum(['tired', 'energized']).nullable().optional(),
  language: z.enum(['en', 'ar']).default('en'),
});

const EndBody = z.object({
  abandoned: z.boolean().default(false),
  language: z.enum(['en', 'ar']).default('en'),
});

const aiDirectorRoutes: FastifyPluginAsync = async (fastify) => {
  /* ═══ Start a new session ═══ */
  fastify.post('/ai/director/start', async (request, reply) => {
    const parsed = StartBody.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'invalid_payload',
        issues: parsed.error.flatten().fieldErrors,
      });
    }

    const userId = await getOrCreateDemoUser();
    const lang = parsed.data.language as Lang;

    try {
      const [ctx, candidates] = await Promise.all([
        loadDirectorContext(userId),
        loadScriptCandidates(userId),
      ]);

      const result = await generateScript(ctx, candidates, lang);

      const session = await createDirectorSession(userId, result.script);

      return reply.code(201).send({
        session_id: session.id,
        started_at: session.started_at,
        script: result.script,
        first_round: result.script.rounds[0] ?? null,
        source: result.source,
        provider: result.provider,
        model: result.model,
        language: lang,
        latency_ms: result.latency_ms,
        tokens: result.tokens,
      });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({
        error: 'director_start_failed',
        message: (err as Error).message,
      });
    }
  });

  /* ═══ Get session state ═══ */
  fastify.get<{ Params: { id: string } }>(
    '/ai/director/:id',
    async (request, reply) => {
      const userId = await getOrCreateDemoUser();
      const session = await getDirectorSession(request.params.id, userId);
      if (!session) return reply.code(404).send({ error: 'session_not_found' });
      return reply.code(200).send(session);
    }
  );

  /* ═══ Report a round result + get next decision ═══ */
  fastify.post<{ Params: { id: string } }>(
    '/ai/director/:id/checkpoint',
    async (request, reply) => {
      const parsed = CheckpointBody.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'invalid_payload',
          issues: parsed.error.flatten().fieldErrors,
        });
      }

      const userId = await getOrCreateDemoUser();
      const session = await getDirectorSession(request.params.id, userId);
      if (!session) return reply.code(404).send({ error: 'session_not_found' });
      if (session.final_state !== 'active') {
        return reply.code(409).send({ error: 'session_not_active', state: session.final_state });
      }

      const lang = parsed.data.language as Lang;

      /* Rebuild context from existing session data */
      const baseCtx = await loadDirectorContext(userId);
      const existingCheckpoints = session.checkpoints ?? [];
      const roundsCompleted = existingCheckpoints.length;
      const totalDuration = existingCheckpoints.reduce((s, c) => s + (c.duration_ms ?? 0), 0) + parsed.data.duration_ms;
      const avgAcc = roundsCompleted === 0
        ? parsed.data.accuracy
        : (existingCheckpoints.reduce((s, c) => s + c.accuracy, 0) + parsed.data.accuracy) / (roundsCompleted + 1);

      /* Count consecutive low rounds (including this one) */
      let consecutiveLow = parsed.data.accuracy < 55 ? 1 : 0;
      for (let i = existingCheckpoints.length - 1; i >= 0; i--) {
        const prev = existingCheckpoints[i];
        if (prev && prev.accuracy < 55) consecutiveLow++;
        else break;
      }

      const ctx: DirectorContext = {
        ...baseCtx,
        rounds_completed: roundsCompleted + 1,
        rounds_planned: session.script.rounds.length,
        session_duration_ms: totalDuration,
        session_avg_accuracy: avgAcc,
        last_round_accuracy: parsed.data.accuracy,
        last_round_rt_ms: parsed.data.median_rt_ms,
        consecutive_low_rounds: consecutiveLow,
      };

      /* Build the latest round result + call decider */
      const roundResult: DirectorRoundResult = {
        round_number: parsed.data.round_number,
        game_id: parsed.data.game_id,
        accuracy: parsed.data.accuracy,
        median_rt_ms: parsed.data.median_rt_ms,
        level_reached: parsed.data.level_reached,
        duration_ms: parsed.data.duration_ms,
        user_feedback: parsed.data.user_feedback ?? null,
      };

      const placeholder: DirectorCheckpoint = {
        ...roundResult,
        created_at: new Date().toISOString(),
        decision: null,
      };

      try {
        const decisionResult = await decideNextRound(ctx, session.script, placeholder, lang);
        const saved = await appendCheckpoint(session.id, roundResult, decisionResult.decision);

        return reply.code(200).send({
          session_id: session.id,
          round_just_finished: parsed.data.round_number,
          decision: decisionResult.decision,
          next_round: decisionResult.decision.next_round,
          source: decisionResult.source,
          provider: decisionResult.provider,
          model: decisionResult.model,
          language: lang,
          latency_ms: decisionResult.latency_ms,
        });
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({
          error: 'director_checkpoint_failed',
          message: (err as Error).message,
        });
      }
    }
  );

  /* ═══ End session + generate final summary ═══ */
  fastify.post<{ Params: { id: string } }>(
    '/ai/director/:id/end',
    async (request, reply) => {
      const parsed = EndBody.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'invalid_payload',
          issues: parsed.error.flatten().fieldErrors,
        });
      }

      const userId = await getOrCreateDemoUser();
      const session = await getDirectorSession(request.params.id, userId);
      if (!session) return reply.code(404).send({ error: 'session_not_found' });

      const lang = parsed.data.language as Lang;
      const checkpoints = session.checkpoints ?? [];

      /* If already ended, return summary from cache (regenerate) */
      const roundsCompleted = checkpoints.length;
      const totalDuration = checkpoints.reduce((s, c) => s + (c.duration_ms ?? 0), 0);
      const avgAcc = roundsCompleted > 0
        ? checkpoints.reduce((s, c) => s + c.accuracy, 0) / roundsCompleted
        : 0;
      const avgRt = roundsCompleted > 0
        ? checkpoints.reduce((s, c) => s + c.median_rt_ms, 0) / roundsCompleted
        : 0;

      const ctx: DirectorContext = {
        total_sessions: 0,
        avg_accuracy_7d: 0,
        days_since_last: null,
        top_strengths: [],
        top_weaknesses: [],
        evidence_tier: 'calibrating',
        rounds_completed: roundsCompleted,
        rounds_planned: session.script.rounds.length,
        session_duration_ms: totalDuration,
        session_avg_accuracy: avgAcc,
        last_round_accuracy: checkpoints[checkpoints.length - 1]?.accuracy ?? 0,
        last_round_rt_ms: checkpoints[checkpoints.length - 1]?.median_rt_ms ?? 0,
        consecutive_low_rounds: 0,
      };

      try {
        const summary = await generateFinalSummary(ctx, session.script, checkpoints, lang);

        if (session.final_state === 'active') {
          await markSessionEnded(
            session.id,
            parsed.data.abandoned ? 'abandoned' : 'completed'
          );
        }

        return reply.code(200).send({
          session_id: session.id,
          ended_at: new Date().toISOString(),
          duration_ms: totalDuration,
          total_rounds: session.script.rounds.length,
          completed_rounds: roundsCompleted,
          avg_accuracy: Math.round(avgAcc * 10) / 10,
          avg_median_rt_ms: Math.round(avgRt),
          final_script: summary.final_script,
          highlights: summary.highlights,
          next_recommendation: summary.next_recommendation,
          source: summary.source,
          provider: summary.provider,
          model: summary.model,
          language: lang,
          latency_ms: summary.latency_ms,
        });
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({
          error: 'director_end_failed',
          message: (err as Error).message,
        });
      }
    }
  );
};

export default aiDirectorRoutes;