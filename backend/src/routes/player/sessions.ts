import type { FastifyPluginAsync } from 'fastify';
import { SessionSchema } from '../../schemas/session.js';
import { deriveMetrics } from '../../services/data/derive.js';
import { getOrCreateDemoUser, getNextChangeSeq } from '../../services/users.js';
import { checkAndUpdatePB, getGameMetricInfo } from '../../services/data/pb.js';
import { checkAndUnlockBadges } from '../../services/data/badges.js';
import {
  getOrInitAbility,
  decideNextLevel,
  applyDecision,
} from '../../services/difficulty/engine.js';
import { updateUserGameStats, updateDomainScores } from '../../services/data/stats.js';
import { withUserLock } from '../../services/user-lock.js';
import { optionalPlayer } from '../../middleware/auth.js';
import { validateIngestion, validateDuration } from '../../services/safety/ingestion-validator.js';
import { evaluateSession, logIntegrityEvent } from '../../services/safety/integrity-rules.js';

type Metrics = Awaited<ReturnType<typeof deriveMetrics>>;

type LockResult =
  | { kind: 'duplicate'; id: string; seq: number }
  | { kind: 'accepted'; id: string; seq: number; metrics: Metrics };

const sessionsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/sessions', { preHandler: optionalPlayer }, async (request, reply) => {
    /* 1. Validate */
    const parsed = SessionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'invalid_payload',
        issues: parsed.error.flatten().fieldErrors,
      });
    }
    const session = parsed.data;
    /* Resolve player: authenticated > demo (opt-in only) > reject */
    const demoFallbackEnabled = process.env.DEMO_MODE === 'true';
    let userId = request.player?.playerId;
    if (!userId && demoFallbackEnabled) {
      userId = await getOrCreateDemoUser();
    }
    if (!userId) {
      return reply.code(401).send({
        error: 'auth_required',
        message: 'Authentication required. Enable DEMO_MODE for demo access.',
      });
    }

    /* 2. Duration + ingestion checks (R07) */
    const dur = validateDuration(session.started_at, session.ended_at);
    if (!dur.ok) {
      return reply.code(400).send({ error: 'invalid_duration' });
    }
    const duration_ms = dur.durationMs;

    const ing = validateIngestion({
      gameId: session.game_id,
      mode: session.mode,
      trials: session.trials as any,
    });
    if (!ing.ok) {
      return reply.code(400).send({
        error: 'invalid_trials',
        details: ing.errors,
        stats: ing.stats,
      });
    }

    /* 3. Derive metrics */
    let metrics: Metrics;
    try {
      metrics = await deriveMetrics(session.game_id, session.trials);
    } catch (err) {
      request.log.error({ err }, 'deriveMetrics failed');
      return reply.code(500).send({ error: 'internal_error' });
    }

    /* 4. Critical section (R05) */
    let result: LockResult;
    try {
      result = await withUserLock<LockResult>(userId, async (client) => {
        const existing = await client.query<{ id: string; change_seq: number }>(
          'SELECT id, change_seq FROM sessions WHERE user_id = $1 AND client_session_id = $2',
          [userId, session.client_session_id]
        );
        if (existing.rowCount && existing.rowCount > 0) {
          const row = existing.rows[0]!;
          return { kind: 'duplicate', id: row.id, seq: row.change_seq };
        }

        const changeSeq = await getNextChangeSeq(userId);

        const insertRes = await client.query<{ id: string }>(
          `INSERT INTO sessions (
            user_id, client_session_id, game_id, domain_id, mode, seed, ticket_id,
            started_at, ended_at, duration_ms, n_trials, n_correct, accuracy,
            median_rt_ms, rcs, primary_score, game_version, scoring_version,
            source, status, change_seq
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
          ) RETURNING id`,
          [
            userId, session.client_session_id, session.game_id, session.domain_id,
            session.mode, session.seed, session.ticket_id,
            session.started_at, session.ended_at, duration_ms,
            metrics.n_trials, metrics.n_correct, metrics.accuracy,
            metrics.median_rt_ms, metrics.rcs, metrics.primary_score,
            session.game_version, session.scoring_version,
            session.source, 'accepted', changeSeq,
          ]
        );
        const sessionId = insertRes.rows[0]!.id;

        await client.query(
          'INSERT INTO session_trials (session_id, trial_schema_version, trials) VALUES ($1, $2, $3)',
          [sessionId, 1, JSON.stringify(session.trials)]
        );

        return { kind: 'accepted', id: sessionId, seq: changeSeq, metrics };
      });
    } catch (err) {
      request.log.error({ err }, 'POST /sessions lock failed');
      return reply.code(500).send({ error: 'internal_error' });
    }

    if (result.kind === 'duplicate') {
      return reply.code(200).send({
        status: 'already_accepted',
        server_session_id: result.id,
        change_seq: result.seq,
      });
    }

    const sessionId = result.id;
    const changeSeq = result.seq;

    /* 5. PB */
    const metricInfo = await getGameMetricInfo(session.game_id);
    let pbResult = null;
    if (metricInfo) {
      pbResult = await checkAndUpdatePB({
        userId,
        gameId: session.game_id,
        variant: session.mode,
        metric: metricInfo.primary_metric,
        direction: metricInfo.metric_direction,
        value: metrics.primary_score,
        sessionId,
      });
    }

    /* 6. Badges */
    const badges = await checkAndUnlockBadges({
      userId,
      sessionId,
      mode: session.mode,
      accuracy: metrics.accuracy,
    });

    /* 7. Stats (non-fatal) */
    try {
      await updateUserGameStats(userId, session.game_id, session.mode);
      await updateDomainScores(userId);
    } catch (statsErr) {
      request.log.warn({ err: statsErr }, 'Stats update failed (non-fatal)');
    }

    /* 8. Adaptive engine (non-fatal) */
    let engineDecision = null;
    try {
      const currentAbility = await getOrInitAbility(userId, session.game_id, session.mode);
      const decision = decideNextLevel(currentAbility, metrics.accuracy, metrics.median_rt_ms);
      await applyDecision(
        userId, session.game_id, session.mode, sessionId,
        currentAbility, decision, metrics.accuracy
      );
      engineDecision = {
        from_level: decision.from_level,
        to_level: decision.to_level,
        reason_code: decision.reason_code,
        explanation: decision.explanation,
        predicted_success: decision.predicted_success ?? 0,
      };
    } catch (err) {
      request.log.warn({ err }, 'Engine decision failed (non-fatal)');
    }

    /* 9. Integrity shadow (R40) */
    try {
      const flags = evaluateSession({
        gameId: session.game_id,
        mode: session.mode,
        durationMs: duration_ms,
        accuracy: metrics.accuracy,
        medianRtMs: metrics.median_rt_ms ?? 0,
        trials: session.trials as any,
      });
      for (const flag of flags) {
        await logIntegrityEvent({ sessionId, userId, flag });
      }
    } catch (integrityErr) {
      request.log.warn({ err: integrityErr }, 'integrity shadow failed (non-fatal)');
    }

    return reply.code(201).send({
      status: 'accepted',
      server_session_id: sessionId,
      change_seq: changeSeq,
      derived: metrics,
      pb: pbResult,
      badges,
      engine: engineDecision,
    });
  });
};

export default sessionsRoutes;