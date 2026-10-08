import { pool } from '../config/db.js';

interface UserProfile {
  domain_scores: Record<string, number>;
  games_played: string[];
  games_weak: string[];
  games_strong: string[];
  last_session_at: string | null;
  days_since_last: number | null;
}

interface Recommendation {
  game_id: string;
  game_name: string;
  domain_id: string;
  reason: string;
  priority: number;
  suggested_mode: string;
}

export async function buildUserProfile(userId: string): Promise<UserProfile> {
  const domainScores: Record<string, number> = {};
  const domains = await pool.query('SELECT id FROM domains');
  for (const d of domains.rows) domainScores[d.id] = 0;

  const gamesAgg = await pool.query<{ game_id: string; n: number; avg_score: number; last_at: string }>(
    `SELECT game_id, COUNT(*)::int AS n, AVG(primary_score)::float AS avg_score, MAX(ended_at) AS last_at
     FROM sessions
     WHERE user_id = $1 AND status = 'accepted'
     GROUP BY game_id`,
    [userId]
  );

  const games_played: string[] = [];
  const games_weak: string[] = [];
  const games_strong: string[] = [];
  let lastSessionAt: string | null = null;

  for (const row of gamesAgg.rows) {
    games_played.push(row.game_id);
    if (row.avg_score < 60) games_weak.push(row.game_id);
    if (row.avg_score >= 80) games_strong.push(row.game_id);
    if (!lastSessionAt || new Date(row.last_at) > new Date(lastSessionAt)) {
      lastSessionAt = row.last_at;
    }
  }

  const domainGames = await pool.query<{ game_id: string; domain_id: string; avg: number }>(
    `SELECT s.game_id, g.domain_id, AVG(s.primary_score)::float AS avg
     FROM sessions s
     JOIN games g ON g.id = s.game_id
     WHERE s.user_id = $1 AND s.status = 'accepted'
     GROUP BY s.game_id, g.domain_id`,
    [userId]
  );

  const domainAgg: Record<string, { sum: number; count: number }> = {};
  for (const row of domainGames.rows) {
    let agg = domainAgg[row.domain_id];
    if (!agg) {
      agg = { sum: 0, count: 0 };
      domainAgg[row.domain_id] = agg;
    }
    agg.sum += row.avg;
    agg.count += 1;
  }
  for (const [domainId, agg] of Object.entries(domainAgg)) {
    domainScores[domainId] = Math.round((agg.sum / agg.count) * 100) / 100;
  }

  const days = lastSessionAt
    ? Math.floor((Date.now() - new Date(lastSessionAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    domain_scores: domainScores,
    games_played,
    games_weak,
    games_strong,
    last_session_at: lastSessionAt,
    days_since_last: days,
  };
}

export async function getRecommendations(userId: string, limit = 3): Promise<Recommendation[]> {
  const profile = await buildUserProfile(userId);
  const recs: Recommendation[] = [];

  if (profile.games_played.length === 0) {
    const starters = await pool.query<{ id: string; name: string; domain_id: string }>(
      `SELECT id, name, domain_id FROM games
       WHERE id IN ('seq-mem', 'reaction', 'n-back')
       ORDER BY CASE id WHEN 'seq-mem' THEN 1 WHEN 'reaction' THEN 2 ELSE 3 END
       LIMIT $1`,
      [limit]
    );
    return starters.rows.map((g) => ({
      game_id: g.id,
      game_name: g.name,
      domain_id: g.domain_id,
      reason: 'Great starter game — perfect for your first session',
      priority: 100,
      suggested_mode: 'classic',
    }));
  }

  if (profile.days_since_last !== null && profile.days_since_last >= 3) {
    const dailyGame = profile.games_played[0] ?? 'seq-mem';
    const g = await pool.query<{ id: string; name: string; domain_id: string }>(
      'SELECT id, name, domain_id FROM games WHERE id = $1',
      [dailyGame]
    );
    const first = g.rows[0];
    if (first) {
      recs.push({
        game_id: first.id,
        game_name: first.name,
        domain_id: first.domain_id,
        reason: `You haven't played in ${profile.days_since_last} days — Daily mode gets you back on track`,
        priority: 95,
        suggested_mode: 'daily',
      });
    }
  }

  const weakToRecommend = profile.games_weak
    .filter((id) => !recs.find((r) => r.game_id === id))
    .slice(0, 1);
  for (const gameId of weakToRecommend) {
    const g = await pool.query<{ id: string; name: string; domain_id: string }>(
      'SELECT id, name, domain_id FROM games WHERE id = $1',
      [gameId]
    );
    const first = g.rows[0];
    if (first) {
      recs.push({
        game_id: first.id,
        game_name: first.name,
        domain_id: first.domain_id,
        reason: 'Your accuracy is below 60% — try Precision mode to build consistency',
        priority: 80,
        suggested_mode: 'precision',
      });
    }
  }

  const weakest = Object.entries(profile.domain_scores)
    .filter(([id, score]) => score > 0 && score < 70 && !recs.find((r) => r.domain_id === id))
    .sort((a, b) => a[1] - b[1])[0];

  if (weakest && recs.length < limit) {
    const g = await pool.query<{ id: string; name: string; domain_id: string }>(
      `SELECT id, name, domain_id FROM games
       WHERE domain_id = $1
       AND id <> ALL($2::text[])
       ORDER BY RANDOM() LIMIT 1`,
      [weakest[0], profile.games_played]
    );
    const first = g.rows[0];
    if (first) {
      recs.push({
        game_id: first.id,
        game_name: first.name,
        domain_id: first.domain_id,
        reason: `Your ${weakest[0]} domain needs attention (score: ${weakest[1]})`,
        priority: 75,
        suggested_mode: 'classic',
      });
    }
  }

  if (profile.games_strong.length > 0 && recs.length < limit) {
    const strongGame = profile.games_strong[0]!;
    const already = recs.find((r) => r.game_id === strongGame);
    if (!already) {
      const g = await pool.query<{ id: string; name: string; domain_id: string }>(
        'SELECT id, name, domain_id FROM games WHERE id = $1',
        [strongGame]
      );
      const first = g.rows[0];
      if (first) {
        recs.push({
          game_id: first.id,
          game_name: first.name,
          domain_id: first.domain_id,
          reason: `You excel here — try Endless mode to test your limits`,
          priority: 70,
          suggested_mode: 'endless',
        });
      }
    }
  }

  if (recs.length < limit) {
    const remaining = limit - recs.length;
    const existing = recs.map((r) => r.game_id);
    const allExcluded = [...existing, ...profile.games_played];
    const fillers = await pool.query<{ id: string; name: string; domain_id: string }>(
      `SELECT id, name, domain_id FROM games
       WHERE status = 'ready'
       AND id <> ALL($1::text[])
       ORDER BY RANDOM() LIMIT $2`,
      [allExcluded, remaining]
    );
    for (const g of fillers.rows) {
      recs.push({
        game_id: g.id,
        game_name: g.name,
        domain_id: g.domain_id,
        reason: 'Try something new to broaden your cognitive profile',
        priority: 50,
        suggested_mode: 'classic',
      });
    }
  }

  recs.sort((a, b) => b.priority - a.priority);
  return recs.slice(0, limit);
}