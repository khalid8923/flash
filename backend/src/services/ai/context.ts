/* ═══════════════════════════════════════════════════════════
   AI Context Builder — gathers everything the coach needs
   about a user to answer intelligently.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';
import { buildDailyPlan } from '../planner.js';

export interface UserContext {
  stats: {
    total_sessions: number;
    avg_accuracy: number;
    last_played_at: string | null;
    days_since_last: number | null;
  };
  domain_scores: Record<string, number>;
  top_strengths: Array<{ domain: string; score: number }>;
  top_weaknesses: Array<{ domain: string; score: number }>;
  personal_bests: Array<{ game_id: string; metric: string; value: number }>;
  badges: Array<{ name: string; tier: string }>;
  recent_games: string[];
  ability: Array<{ game_id: string; level: number; successes: number; failures: number }>;
  recent_decisions: Array<{ game_id: string; reason_code: string; from_level: number; to_level: number }>;
  today_plan: Array<{ game_id: string; game_name: string; mode: string; minutes: number; reason: string }>;
}

export async function buildUserContext(userId: string): Promise<UserContext> {
  /* ─── Stats ─── */
  const statsRes = await pool.query(
    `SELECT COUNT(*)::int AS total,
            COALESCE(AVG(accuracy), 0)::float AS avg_accuracy,
            MAX(ended_at) AS last_at
     FROM sessions WHERE user_id = $1 AND status = 'accepted'`,
    [userId]
  );
  const stats = statsRes.rows[0] ?? { total: 0, avg_accuracy: 0, last_at: null };
  const days = stats.last_at
    ? Math.floor((Date.now() - new Date(stats.last_at).getTime()) / 86400000)
    : null;

  /* ─── Domain scores ─── */
  const domainRes = await pool.query(
    `SELECT g.domain_id, AVG(s.primary_score)::float AS avg
     FROM sessions s
     JOIN games g ON g.id = s.game_id
     WHERE s.user_id = $1 AND s.status = 'accepted'
     GROUP BY g.domain_id`,
    [userId]
  );
  const domain_scores: Record<string, number> = {};
  const allDomains = await pool.query('SELECT id FROM domains');
  for (const d of allDomains.rows) domain_scores[d.id] = 0;
  for (const r of domainRes.rows) {
    domain_scores[r.domain_id] = Math.round(r.avg * 100) / 100;
  }
  const ranked = Object.entries(domain_scores)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  /* ─── PBs ─── */
  const pbRes = await pool.query(
    `SELECT game_id, metric, value FROM personal_bests
     WHERE user_id = $1 ORDER BY achieved_at DESC LIMIT 10`,
    [userId]
  );

  /* ─── Badges ─── */
  const badgeRes = await pool.query(
    `SELECT b.name, b.tier FROM user_badges ub
     JOIN badges b ON b.id = ub.badge_id
     WHERE ub.user_id = $1 AND ub.revoked_at IS NULL
     ORDER BY ub.unlocked_at DESC LIMIT 10`,
    [userId]
  );

  /* ─── Recent games (FIXED) ─── */
  const recentRes = await pool.query(
    `SELECT game_id, MAX(ended_at) AS last_played
     FROM sessions
     WHERE user_id = $1 AND status = 'accepted'
     GROUP BY game_id
     ORDER BY last_played DESC
     LIMIT 6`,
    [userId]
  );

  /* ─── Ability ─── */
  const abilRes = await pool.query(
    `SELECT game_id, current_level, consecutive_successes, consecutive_failures
     FROM player_game_ability WHERE user_id = $1
     ORDER BY last_updated_at DESC LIMIT 10`,
    [userId]
  );

  /* ─── Recent engine decisions ─── */
  const decRes = await pool.query(
    `SELECT game_id, reason_code, from_level, to_level
     FROM engine_decisions WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 5`,
    [userId]
  );

  /* ─── Today's plan ─── */
  let today_plan: UserContext['today_plan'] = [];
  try {
    const plan = await buildDailyPlan(userId);
    today_plan = plan.sessions.map((s) => ({
      game_id: s.game_id,
      game_name: s.game_name,
      mode: s.mode,
      minutes: s.estimated_minutes,
      reason: s.reason,
    }));
  } catch { /* ignore */ }

  return {
    stats: {
      total_sessions: stats.total,
      avg_accuracy: Math.round(stats.avg_accuracy * 100) / 100,
      last_played_at: stats.last_at,
      days_since_last: days,
    },
    domain_scores,
    top_strengths: ranked.slice(0, 3).map(([domain, score]) => ({ domain, score })),
    top_weaknesses: ranked.slice(-3).reverse().map(([domain, score]) => ({ domain, score })),
    personal_bests: pbRes.rows,
    badges: badgeRes.rows,
    recent_games: recentRes.rows.map((r) => r.game_id),
    ability: abilRes.rows.map((r) => ({
      game_id: r.game_id,
      level: r.current_level,
      successes: r.consecutive_successes,
      failures: r.consecutive_failures,
    })),
    recent_decisions: decRes.rows,
    today_plan,
  };
}

export function contextToPrompt(ctx: UserContext): string {
  const lines: string[] = [];
  lines.push('=== USER PROFILE ===');
  lines.push(`Total sessions: ${ctx.stats.total_sessions}`);
  lines.push(`Average accuracy: ${ctx.stats.avg_accuracy}%`);
  if (ctx.stats.days_since_last !== null) {
    lines.push(`Days since last session: ${ctx.stats.days_since_last}`);
  }

  if (ctx.top_strengths.length) {
    lines.push(`\nTop strengths: ${ctx.top_strengths.map((s) => `${s.domain} (${s.score})`).join(', ')}`);
  }
  if (ctx.top_weaknesses.length) {
    lines.push(`Top weaknesses: ${ctx.top_weaknesses.map((s) => `${s.domain} (${s.score})`).join(', ')}`);
  }

  if (ctx.personal_bests.length) {
    lines.push(`\nPersonal bests:`);
    for (const pb of ctx.personal_bests.slice(0, 5)) {
      lines.push(`  - ${pb.game_id}: ${pb.metric} = ${pb.value}`);
    }
  }

  if (ctx.badges.length) {
    lines.push(`\nRecent badges: ${ctx.badges.slice(0, 5).map((b) => `${b.name} (${b.tier})`).join(', ')}`);
  }

  if (ctx.ability.length) {
    lines.push(`\nCurrent ability per game:`);
    for (const a of ctx.ability.slice(0, 5)) {
      lines.push(`  - ${a.game_id}: level ${a.level}, streak +${a.successes}/-${a.failures}`);
    }
  }

  if (ctx.recent_decisions.length) {
    lines.push(`\nRecent engine decisions:`);
    for (const d of ctx.recent_decisions) {
      lines.push(`  - ${d.game_id}: ${d.reason_code} (${d.from_level} → ${d.to_level})`);
    }
  }

  if (ctx.today_plan.length) {
    lines.push(`\nToday's suggested ritual:`);
    for (const p of ctx.today_plan) {
      lines.push(`  - [${p.mode}] ${p.game_name} (${p.minutes}min) — ${p.reason}`);
    }
  }

  return lines.join('\n');
}