import type { FastifyPluginAsync } from 'fastify';
import { pool } from '../config/db.js';
import { SessionSchema } from '../schemas/session.js';
import { deriveMetrics } from '../services/derive.js';
import { getOrCreateDemoUser, getNextChangeSeq } from '../services/users.js';
import { checkAndUpdatePB, getGameMetricInfo } from '../services/pb.js';
import { checkAndUnlockBadges } from '../services/badges.js';

const sessionsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/sessions', async (request, reply) => {
    const parsed = SessionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'invalid_payload',
        issues: parsed.error.flatten().fieldErrors,
      });
    }
    const session = parsed.data;
    const userId = await getOrCreateDemoUser();

    const existing = await pool.query(
      'SELECT id, change_seq FROM sessions WHERE user_id = $1 AND client_session_id = $2',
      [userId, session.client_session_id]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      return reply.code(200).send({
        status: 'already_accepted',
        server_session_id: existing.rows[0].id,
        change_seq: existing.rows[0].change_seq,
        derived: null,
        pb: null,
        badges: [],
      });
    }

    const duration_ms = new Date(session.ended_at).getTime() -
                        new Date(session.started_at).getTime();
    if (duration_ms < 0 || duration_ms > 3_600_000) {
      return reply.code(400).send({ error: 'invalid_duration' });
    }

    const metrics = await deriveMetrics(session.game_id, session.trials);
    const changeSeq = await getNextChangeSeq(userId);

    const client = await pool.connect();
    let sessionId = '';
    try {
      await client.query('BEGIN');

      const insertRes = await client.query(
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

      sessionId = insertRes.rows[0].id;
      await client.query(
        'INSERT INTO session_trials (session_id, trial_schema_version, trials) VALUES ($1, $2, $3)',
        [sessionId, 1, JSON.stringify(session.trials)]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      request.log.error(err);
      return reply.code(500).send({ error: 'internal_error' });
    } finally {
      client.release();
    }

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

    const badges = await checkAndUnlockBadges({
      userId,
      sessionId,
      mode: session.mode,
      accuracy: metrics.accuracy,
    });

    return reply.code(201).send({
      status: 'accepted',
      server_session_id: sessionId,
      change_seq: changeSeq,
      derived: metrics,
      pb: pbResult,
      badges,
    });
  });
};

export default sessionsRoutes;