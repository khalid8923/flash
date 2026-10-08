import type { FastifyPluginAsync } from 'fastify';
import { SessionSchema } from '../schemas/session.js';
import { deriveMetrics } from '../services/derive.js';
import { getOrCreateDemoUser, getNextChangeSeq } from '../services/users.js';
import { checkAndUpdatePB, getGameMetricInfo } from '../services/pb.js';
import { checkAndUnlockBadges } from '../services/badges.js';
import {
  getOrInitAbility,
  decideNextLevel,
  applyDecision,
} from '../services/difficulty/engine.js';
import { updateUserGameStats, updateDomainScores } from '../services/stats.js';
import { withUserLock } from '../services/user-lock.js';

type Metrics = Awaited<ReturnType<typeof deriveMetrics>>;

type LockResult =
  | { kind: 'duplicate'; id: string; seq: number }
  | { kind: 'accepted'; id: string; seq: number; metrics: Metrics };

const sessionsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/sessions', async (request, reply) => {
    /* 1. Validate */
    const parsed = SessionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'invalid_payload',
        issues: parsed.error.flatten().fieldErrors,
      });
    }
    const session = parsed.data;
    const userId = await getOrCreateDemoUser();

    /* 2. Duration check (cheap, before lock) */
    const duration_ms = new Date(session.ended_at).getTime() -
                        new Date(session.started_at).getTime();
    if (duration_ms < 0 || duration_ms > 3_600_000) {
      return reply.code(400).send({ error: 'invalid_duration' });
    }

    /* 3. Derive metrics (read-only, safe to do before lock) */
    let metrics: Metrics;
    try {
      metrics = await deriveMetrics(session.game_id, session.trials);
    } catch (err) {
      request.log.error({ err }, 'deriveMetrics failed');
      return reply.code(500).send({ error: 'internal_error' });
    }

    /* 4. Critical section: serialize per user (R05) */
    let result: LockResult;
    try {
      result = await withUserLock<LockResult>(userId, async (client) => {
        /* 4a. Idempotency check INSIDE lock */
        const existing = await client.query<{ id: string; change_seq: number }>(
          'SELECT id, change_seq FROM sessions WHERE user_id = $1 AND client_session_id = $2',
          [userId, session.client_session_id]
        );
        if (existing.rowCount && existing.rowCount > 0) {
          const row = existing.rows[0]!;
          return { kind: 'duplicate', id: row.id, seq: row.change_seq };
        }

        /* 4b. Next change_seq */
        const changeSeq = await getNextChangeSeq(userId);

        /* 4c. Insert session */
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

        /* 4d. Insert trials */
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

    /* 5. Duplicate fast path */
    if (result.kind === 'duplicate') {
      return reply.code(200).send({
        status: 'already_accepted',
        server_session_id: result.id,
        change_seq: result.seq,
      });
    }

    /* 6. Side-effects (outside lock - idempotent) */
    const sessionId = result.id;
    const changeSeq = result.seq;

    /* PB */
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

    /* Badges */
    const badges = await checkAndUnlockBadges({
      userId,
      sessionId,
      mode: session.mode,
      accuracy: metrics.accuracy,
    });

    /* Stats (non-fatal) */
    try {
      await updateUserGameStats(userId, session.game_id, session.mode);
      await updateDomainScores(userId);
    } catch (statsErr) {
      request.log.warn({ err: statsErr }, 'Stats update failed (non-fatal)');
    }

    /* Adaptive engine (non-fatal) */
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
        predicted_success: decision.predicted_success,
      };
    } catch (err) {
      request.log.warn({ err }, 'Engine decision failed (non-fatal)');
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