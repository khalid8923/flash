/* ═══════════════════════════════════════════════════════════
   Session Planner — builds today's "3-specimen ritual"
   Uses: player ability + difficulty atlas + recommendations
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../config/db.js';
import { buildUserProfile } from './recommendations.js';

export type PlannerMode = 'warmup' | 'train' | 'challenge' | 'recovery';

export interface PlannedSession {
  game_id: string;
  game_name: string;
  domain_id: string;
  domain_name: string;
  mode: PlannerMode;
  level: number;
  level_label: string;
  estimated_minutes: number;
  reason: string;
  target_success: number;
}

export interface DailyPlan {
  generated_at: string;
  total_minutes: number;
  sessions: PlannedSession[];
  rationale: string;
}

const TIME_PER_SPECIMEN = { warmup: 2, train: 2.5, challenge: 1.5 } as const;

/* Which domains are strongest/weakest based on user data */
async function getDomainRanking(userId: string): Promise<Array<{ id: string; score: number }>> {
  const res = await pool.query<{ domain_id: string; avg: number }>(
    `SELECT g.domain_id, AVG(s.primary_score)::float AS avg
     FROM sessions s
     JOIN games g ON g.id = s.game_id
     WHERE s.user_id = $1 AND s.status = 'accepted'
     GROUP BY g.domain_id`,
    [userId]
  );
  const scores: Record<string, number> = {};
  for (const row of res.rows) scores[row.domain_id] = row.avg;
  const domains = await pool.query('SELECT id FROM domains ORDER BY id');
  return domains.rows.map((d) => ({ id: d.id, score: scores[d.id] ?? 0 }));
}

/* Which games the user hasn't played much */
async function getUnderplayedGames(userId: string, limit = 5): Promise<string[]> {
  const res = await pool.query<{ id: string }>(
    `SELECT g.id FROM games g
     WHERE g.status = 'ready'
     AND g.id NOT IN (
       SELECT game_id FROM sessions WHERE user_id = $1 AND status = 'accepted'
     )
     ORDER BY RANDOM() LIMIT $2`,
    [userId, limit]
  );
  return res.rows.map((r) => r.id);
}

/* Get the player's current level for a game */
async function getPlayerLevel(userId: string, gameId: string): Promise<number> {
  const res = await pool.query<{ current_level: number }>(
    `SELECT current_level FROM player_game_ability
     WHERE user_id = $1 AND game_id = $2 AND mode = 'classic'`,
    [userId, gameId]
  );
  return res.rows[0]?.current_level ?? 3;
}

/* Get the difficulty config for a game at a level */
async function getLevelConfig(gameId: string, level: number) {
  const res = await pool.query<{
    level: number;
    label: string;
    calibrated_difficulty: number;
  }>(
    `SELECT level, label, calibrated_difficulty
     FROM difficulty_configs
     WHERE game_id = $1 AND mode = 'classic' AND level = $2`,
    [gameId, level]
  );
  return res.rows[0] ?? null;
}

/* Get game metadata */
async function getGameMeta(gameId: string) {
  const res = await pool.query<{
    id: string;
    name: string;
    domain_id: string;
    domain_name: string;
  }>(
    `SELECT g.id, g.name, g.domain_id, d.name AS domain_name
     FROM games g
     JOIN domains d ON d.id = g.domain_id
     WHERE g.id = $1`,
    [gameId]
  );
  return res.rows[0] ?? null;
}

/* ═══════════════════════════════════════════════════════════
   Build today's ritual: warm-up → train → challenge
   ═══════════════════════════════════════════════════════════ */
export async function buildDailyPlan(userId: string): Promise<DailyPlan> {
  const profile = await buildUserProfile(userId);
  const ranking = await getDomainRanking(userId);
  const hasPlayed = profile.games_played.length > 0;

  const sessions: PlannedSession[] = [];

  /* ─── Slot 1: Warm-up (familiar, easy) ─── */
  let warmupGame: string | null = null;
  if (hasPlayed) {
    /* Pick a familiar game in a mid-range domain */
    const midDomain = [...ranking].sort((a, b) => Math.abs(a.score - 70) - Math.abs(b.score - 70))[0];
    if (midDomain) {
      const res = await pool.query<{ id: string }>(
        `SELECT id FROM games WHERE domain_id = $1 AND status = 'ready'
         AND id = ANY($2::text[]) LIMIT 1`,
        [midDomain.id, profile.games_played]
      );
      warmupGame = res.rows[0]?.id ?? null;
    }
  }

  if (!warmupGame) {
    warmupGame = 'seq-mem'; /* always-safe default */
  }

  const warmupMeta = await getGameMeta(warmupGame);
  if (warmupMeta) {
    const currentLevel = await getPlayerLevel(userId, warmupGame);
    const warmupLevel = Math.max(1, currentLevel - 1);
    const cfg = await getLevelConfig(warmupGame, warmupLevel);
    sessions.push({
      game_id: warmupGame,
      game_name: warmupMeta.name,
      domain_id: warmupMeta.domain_id,
      domain_name: warmupMeta.domain_name,
      mode: 'warmup',
      level: warmupLevel,
      level_label: cfg?.label ?? `Level ${warmupLevel}`,
      estimated_minutes: TIME_PER_SPECIMEN.warmup,
      reason: 'Warm-up session — settle in with a familiar task before the main block.',
      target_success: 0.92,
    });
  }

  /* ─── Slot 2: Train (weakest domain, not yet played today) ─── */
  const weakestDomain = ranking.filter((d) => d.score < 75).sort((a, b) => a.score - b.score)[0]
    ?? ranking[0];

  if (weakestDomain) {
    const usedIds = sessions.map((s) => s.game_id);
    const res = await pool.query<{ id: string }>(
      `SELECT id FROM games
       WHERE domain_id = $1 AND status = 'ready'
       AND id <> ALL($2::text[])
       ORDER BY RANDOM() LIMIT 1`,
      [weakestDomain.id, usedIds]
    );
    const trainGame = res.rows[0]?.id;
    if (trainGame) {
      const meta = await getGameMeta(trainGame);
      if (meta) {
        const currentLevel = await getPlayerLevel(userId, trainGame);
        const cfg = await getLevelConfig(trainGame, currentLevel);
        sessions.push({
          game_id: trainGame,
          game_name: meta.name,
          domain_id: meta.domain_id,
          domain_name: meta.domain_name,
          mode: 'train',
          level: currentLevel,
          level_label: cfg?.label ?? `Level ${currentLevel}`,
          estimated_minutes: TIME_PER_SPECIMEN.train,
          reason: `Your ${meta.domain_name} domain has room to grow. This is your main practice block.`,
          target_success: 0.82,
        });
      }
    }
  }

  /* ─── Slot 3: Challenge (stretch or novel) ─── */
  const usedIds = sessions.map((s) => s.game_id);
  let challengeGame: string | null = null;

  /* Prefer underplayed games */
  const underplayed = await getUnderplayedGames(userId, 3);
  challengeGame = underplayed.find((id) => !usedIds.includes(id)) ?? null;

  /* Fallback: strongest domain but harder level */
  if (!challengeGame && profile.games_strong.length > 0) {
    challengeGame = profile.games_strong.find((id) => !usedIds.includes(id)) ?? null;
  }

  /* Final fallback: any unplayed game */
  if (!challengeGame) {
    const res = await pool.query<{ id: string }>(
      `SELECT id FROM games WHERE status = 'ready' AND id <> ALL($1::text[])
       ORDER BY RANDOM() LIMIT 1`,
      [usedIds]
    );
    challengeGame = res.rows[0]?.id ?? null;
  }

  if (challengeGame) {
    const meta = await getGameMeta(challengeGame);
    if (meta) {
      const currentLevel = await getPlayerLevel(userId, challengeGame);
      const cfg = await getLevelConfig(challengeGame, currentLevel);
      sessions.push({
        game_id: challengeGame,
        game_name: meta.name,
        domain_id: meta.domain_id,
        domain_name: meta.domain_name,
        mode: 'challenge',
        level: currentLevel,
        level_label: cfg?.label ?? `Level ${currentLevel}`,
        estimated_minutes: TIME_PER_SPECIMEN.challenge,
        reason: `New territory — this broadens your cognitive profile beyond what you already know.`,
        target_success: 0.72,
      });
    }
  }

  const totalMinutes = Math.round(sessions.reduce((sum, s) => sum + s.estimated_minutes, 0));

  return {
    generated_at: new Date().toISOString(),
    total_minutes: totalMinutes,
    sessions,
    rationale: hasPlayed
      ? 'Balanced ritual: warm-up, weakest-domain focus, and a novel challenge.'
      : 'First session — a gentle introduction across three domains.',
  };
}