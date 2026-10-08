/* ═══════════════════════════════════════════════════════════
   FLASH - Play Ticket Routes (R06)
   POST /plays       — issue a ticket (player auth)
   POST /plays/consume — verify + consume token
   ═══════════════════════════════════════════════════════════ */

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requirePlayer } from '../middleware/auth.js';
import { issueTicket, consumeTicket } from '../services/tickets.js';
import { pool } from '../config/db.js';

const IssueBody = z.object({
  game_id: z.string().min(1).max(64),
  mode: z.enum(['classic', 'speed', 'endless', 'precision', 'daily']).default('classic'),
});

const ConsumeBody = z.object({
  token: z.string().min(10),
});

const playsRoutes: FastifyPluginAsync = async (fastify) => {
  /* ═══ POST /plays — issue ticket ═══ */
  fastify.post('/plays', { preHandler: requirePlayer }, async (req, reply) => {
    const parsed = IssueBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors });
    }
    const { game_id, mode } = parsed.data;
    const playerId = req.player!.playerId;

    /* Verify game exists */
    const g = await pool.query<{ id: string }>(
      `SELECT id FROM games WHERE id = $1 AND deleted_at IS NULL`,
      [game_id]
    );
    if (!g.rowCount) return reply.code(404).send({ error: 'unknown_game' });

    /* Read current level from player_game_ability (or default 1) */
    const ab = await pool.query<{ current_level: number | null }>(
      `SELECT current_level FROM player_game_ability
        WHERE user_id = $1 AND game_id = $2 AND mode = $3`,
      [playerId, game_id, mode]
    );
    const level = ab.rows[0]?.current_level ?? 1;

    const ticket = await issueTicket({
      playerId,
      gameId: game_id,
      mode,
      level,
      deviceId: String(req.headers['x-device-id'] ?? '') || undefined,
    });

    return reply.code(201).send({
      ok: true,
      ticket_id: ticket.ticketId,
      token: ticket.token,
      seed: ticket.seed,
      game_id: ticket.gameId,
      mode: ticket.mode,
      level: ticket.level,
      expires_at: ticket.expiresAt,
    });
  });

  /* ═══ POST /plays/consume — verify + consume ═══ */
  fastify.post('/plays/consume', { preHandler: requirePlayer }, async (req, reply) => {
    const parsed = ConsumeBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors });
    }
    const consumed = await consumeTicket(req.player!.playerId, parsed.data.token);
    if (!consumed) return reply.code(400).send({ error: 'invalid_or_expired_ticket' });

    return {
      ok: true,
      ticket_id: consumed.ticketId,
      seed: consumed.seed,
      game_id: consumed.gameId,
      mode: consumed.mode,
      level: consumed.level,
    };
  });
};

export default playsRoutes;