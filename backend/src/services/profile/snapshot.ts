/* ═══════════════════════════════════════════════════════════
   Unified Snapshot Service
   Single call returning dashboard-ready data.
   Rule: SELF-COMPARISON ONLY. No cross-player stats.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';
import type {
  Lang,
  DomainCard,
  DomainStatus,
  Trend,
  AttentionArea,
  Strength,
  Milestone,
  NextBestAction,
  QuickStats,
  OverallSummary,
  SnapshotResponse,
} from './types.js';

/* ═══════════════════════════════════════════════════════════
   THRESHOLDS (self-comparison rules)
   ═══════════════════════════════════════════════════════════ */
const STRONG_THRESHOLD = 85;      // >= 85% = strong
const STABLE_THRESHOLD = 70;      // 70-85% = stable
const MIN_SESSIONS_FOR_DOMAIN = 1;
const STALE_DAYS = 14;            // not played in 14 days
const TREND_WINDOW = 5;           // last 5 sessions vs earlier

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */
function domainLabel(domainId: string, lang: Lang, meta: Map<string, { name: string; icon: string; color: string }>): string {
  const m = meta.get(domainId);
  if (!m) return domainId;
  return m.name;
}

function statusLabel(status: DomainStatus, lang: Lang): string {
  const map: Record<DomainStatus, { en: string; ar: string }> = {
    strong:             { en: 'Strong',                ar: 'قوي' },
    stable:             { en: 'Stable',                ar: 'مستقر' },
    attention_needed:   { en: 'Needs more work',       ar: 'محتاج شغل أكتر' },
    insufficient_data:  { en: 'Still forming',         ar: 'لسه بيتكوّن' },
  };
  return map[status][lang];
}

function trendLabel(trend: Trend, lang: Lang): string {
  const map: Record<Trend, { en: string; ar: string }> = {
    improving:  { en: 'Improving',   ar: 'بيتحسن' },
    stable:     { en: 'Stable',      ar: 'مستقر' },
    declining:  { en: 'Declining',   ar: 'بينخفض' },
    unknown:    { en: 'Unknown',     ar: 'غير معروف' },
  };
  return map[trend][lang];
}

function patternMessage(
  status: DomainStatus,
  trend: Trend,
  sessionsCount: number,
  lang: Lang
): string {
  if (sessionsCount === 0) {
    return lang === 'ar'
      ? 'لسه مالعبتش هنا — دي فرصة.'
      : 'Not started yet — a clear opportunity.';
  }
  if (sessionsCount < 3) {
    return lang === 'ar'
      ? 'لسه بدري — كمّل جلسات عشان تتضح الصورة.'
      : 'Still early — a few more sessions to see the pattern.';
  }
  if (status === 'strong') {
    return trend === 'improving'
      ? (lang === 'ar' ? 'أداء قوي وبيرتفع.' : 'Solid and climbing.')
      : trend === 'declining'
        ? (lang === 'ar' ? 'قوي بس بيقل شوية — راقب.' : 'Still strong but slipping — keep an eye.')
        : (lang === 'ar' ? 'أداء قوي ومستقر.' : 'Strong and steady.');
  }
  if (status === 'stable') {
    return lang === 'ar'
      ? 'مستقر — جرّب تحدي بسيط للدفع.'
      : 'Steady — try a light challenge to push further.';
  }
  if (status === 'attention_needed') {
    return lang === 'ar'
      ? 'محتاج جلسات تركيز هنا.'
      : 'A few focused sessions would help.';
  }
  return lang === 'ar' ? 'لسه بيتكوّن.' : 'Still forming.';
}

function detectTrend(accuracies: number[]): Trend {
  if (accuracies.length < 3) return 'unknown';
  const recent = accuracies.slice(-TREND_WINDOW);
  const earlier = accuracies.slice(0, -TREND_WINDOW);
  if (earlier.length < 2) {
    /* Compare first half vs second half */
    const mid = Math.floor(accuracies.length / 2);
    const firstHalf = accuracies.slice(0, mid);
    const secondHalf = accuracies.slice(mid);
    if (firstHalf.length === 0 || secondHalf.length === 0) return 'unknown';
    const avg1 = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avg2 = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    if (avg2 - avg1 > 3) return 'improving';
    if (avg2 - avg1 < -3) return 'declining';
    return 'stable';
  }
  const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
  const avgEarlier = earlier.reduce((a, b) => a + b, 0) / earlier.length;
  if (avgRecent - avgEarlier > 3) return 'improving';
  if (avgRecent - avgEarlier < -3) return 'declining';
  return 'stable';
}

/* ═══════════════════════════════════════════════════════════
   DATA LOADING
   ═══════════════════════════════════════════════════════════ */
async function loadDomainMeta(): Promise<Map<string, { name: string; icon: string; color: string }>> {
  const res = await pool.query<{ id: string; name: string; icon: string | null; color: string | null }>(
    `SELECT id, name, icon, color FROM domains ORDER BY id`
  );
  const map = new Map();
  for (const r of res.rows) {
    map.set(r.id, {
      name: r.name,
      icon: r.icon ?? '⚡',
      color: r.color ?? '#00EEFF',
    });
  }
  return map;
}

interface SessionRow {
  game_id: string;
  game_name: string;
  domain_id: string;
  accuracy: number;
  ended_at: string;
}

async function loadUserSessions(userId: string): Promise<SessionRow[]> {
  const res = await pool.query<SessionRow>(
    `SELECT s.game_id, g.name AS game_name, s.domain_id, s.accuracy, s.ended_at
       FROM sessions s
       JOIN games g ON g.id = s.game_id
      WHERE s.user_id = $1
        AND s.status = 'accepted'
        AND s.deleted_at IS NULL
      ORDER BY s.ended_at ASC`,
    [userId]
  );
  return res.rows;
}

async function loadQuickStats(userId: string): Promise<{
  total_sessions: number;
  days_active: number;
  personal_bests_count: number;
  badges_count: number;
  current_streak_days: number;
  active_predictions: number;
  active_lab_experiment: boolean;
  today_journal_logged: boolean;
}> {
  const [sess, pb, badges, pred, lab, journal] = await Promise.all([
    pool.query<{ total: number; days: number }>(
      `SELECT COUNT(*)::int AS total,
              COUNT(DISTINCT DATE(ended_at))::int AS days
         FROM sessions
        WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL`,
      [userId]
    ),
    pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM personal_bests WHERE user_id = $1`,
      [userId]
    ),
    pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM user_badges WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    ),
    pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM predictions
        WHERE user_id = $1 AND computed_at >= NOW() - INTERVAL '7 days'`,
      [userId]
    ),
    pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM lab_experiments
        WHERE user_id = $1 AND status = 'active'`,
      [userId]
    ),
    pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM journal_entries
        WHERE user_id = $1 AND entry_date = CURRENT_DATE`,
      [userId]
    ),
  ]);

  /* Compute current streak of consecutive active days */
  const streakRes = await pool.query<{ day: string }>(
    `SELECT DISTINCT DATE(ended_at)::text AS day
       FROM sessions
      WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL
      ORDER BY day DESC
      LIMIT 30`,
    [userId]
  );
  const days = streakRes.rows.map((r) => r.day);
  let streak = 0;
  if (days.length > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const first = days[0];
    if (first === today || first === yesterday) {
      streak = 1;
      for (let i = 1; i < days.length; i++) {
        const prev = new Date(days[i - 1]!).getTime();
        const cur = new Date(days[i]!).getTime();
        const diff = Math.round((prev - cur) / 86_400_000);
        if (diff === 1) streak++;
        else break;
      }
    }
  }

  return {
    total_sessions: sess.rows[0]?.total ?? 0,
    days_active: sess.rows[0]?.days ?? 0,
    personal_bests_count: pb.rows[0]?.n ?? 0,
    badges_count: badges.rows[0]?.n ?? 0,
    current_streak_days: streak,
    active_predictions: pred.rows[0]?.n ?? 0,
    active_lab_experiment: (lab.rows[0]?.n ?? 0) > 0,
    today_journal_logged: (journal.rows[0]?.n ?? 0) > 0,
  };
}

async function loadMilestones(userId: string): Promise<Milestone[]> {
  const out: Milestone[] = [];

  /* Recent level ups/downs from engine_decisions */
  const decRes = await pool.query<{
    game_id: string;
    game_name: string | null;
    reason_code: string;
    from_level: number;
    to_level: number;
    created_at: string;
  }>(
    `SELECT d.game_id, g.name AS game_name, d.reason_code,
            d.from_level, d.to_level, d.created_at
       FROM engine_decisions d
       LEFT JOIN games g ON g.id = d.game_id
      WHERE d.user_id = $1
        AND d.created_at >= NOW() - INTERVAL '30 days'
        AND d.reason_code IN ('PROMOTE_STABLE', 'DEMOTE_STRUGGLE')
      ORDER BY d.created_at DESC
      LIMIT 5`,
    [userId]
  );

  for (const r of decRes.rows) {
    if (r.reason_code === 'PROMOTE_STABLE' && r.to_level > r.from_level) {
      out.push({
        type: 'level_up',
        game_id: r.game_id,
        game_name: r.game_name,
        detail: `L${r.from_level} → L${r.to_level}`,
        at: r.created_at,
      });
    } else if (r.reason_code === 'DEMOTE_STRUGGLE' && r.to_level < r.from_level) {
      out.push({
        type: 'level_down',
        game_id: r.game_id,
        game_name: r.game_name,
        detail: `L${r.from_level} → L${r.to_level}`,
        at: r.created_at,
      });
    }
  }

  /* Recent badges */
  const badgeRes = await pool.query<{
    badge_name: string;
    tier: string;
    unlocked_at: string;
  }>(
    `SELECT b.name AS badge_name, b.tier, ub.unlocked_at
       FROM user_badges ub
       JOIN badges b ON b.id = ub.badge_id
      WHERE ub.user_id = $1 AND ub.revoked_at IS NULL
      ORDER BY ub.unlocked_at DESC
      LIMIT 3`,
    [userId]
  );

  for (const r of badgeRes.rows) {
    out.push({
      type: 'badge',
      game_id: null,
      game_name: null,
      detail: `${r.badge_name} (${r.tier})`,
      at: r.unlocked_at,
    });
  }

  /* Sort by date desc */
  out.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return out.slice(0, 5);
}

/* ═══════════════════════════════════════════════════════════
   DOMAIN CARDS BUILDER
   ═══════════════════════════════════════════════════════════ */
function buildDomainCards(
  sessions: SessionRow[],
  domainMeta: Map<string, { name: string; icon: string; color: string }>,
  lang: Lang
): DomainCard[] {
  /* Group sessions by domain */
  const byDomain = new Map<string, SessionRow[]>();
  for (const s of sessions) {
    if (!byDomain.has(s.domain_id)) byDomain.set(s.domain_id, []);
    byDomain.get(s.domain_id)!.push(s);
  }

  const now = Date.now();
  const cards: DomainCard[] = [];

  for (const [domainId, meta] of domainMeta.entries()) {
    const domSessions = byDomain.get(domainId) ?? [];
    const sessionsCount = domSessions.length;

    /* Unique games played in this domain */
    const gamesSet = new Set(domSessions.map((s) => s.game_id));

    /* Avg accuracy */
    const avgAcc = sessionsCount > 0
      ? domSessions.reduce((a, s) => a + s.accuracy, 0) / sessionsCount
      : null;

    /* Last played */
    const lastPlayed = sessionsCount > 0
      ? Math.round((now - new Date(domSessions[domSessions.length - 1]!.ended_at).getTime()) / 86_400_000)
      : null;

    /* Status */
    let status: DomainStatus;
    if (sessionsCount < MIN_SESSIONS_FOR_DOMAIN) {
      status = 'insufficient_data';
    } else if (avgAcc !== null && avgAcc >= STRONG_THRESHOLD) {
      status = 'strong';
    } else if (avgAcc !== null && avgAcc >= STABLE_THRESHOLD) {
      status = 'stable';
    } else {
      status = 'attention_needed';
    }

    /* Trend */
    const accuracies = domSessions.map((s) => s.accuracy);
    const trend = detectTrend(accuracies);

    cards.push({
      domain_id: domainId,
      domain_label: meta.name,
      icon: meta.icon,
      color: meta.color,
      status,
      status_label: statusLabel(status, lang),
      avg_accuracy: avgAcc !== null ? Math.round(avgAcc * 10) / 10 : null,
      sessions_count: sessionsCount,
      games_played: Array.from(gamesSet),
      games_count: gamesSet.size,
      trend,
      trend_label: trendLabel(trend, lang),
      pattern: patternMessage(status, trend, sessionsCount, lang),
      last_played_days: lastPlayed,
    });
  }

  /* Sort: strongest first, weakest last for "top" view; but keep stable order by domain_id */
  return cards;
}

/* ═══════════════════════════════════════════════════════════
   ATTENTION AREAS
   ═══════════════════════════════════════════════════════════ */
function buildAttentionAreas(cards: DomainCard[], lang: Lang): AttentionArea[] {
  const areas: AttentionArea[] = [];

  /* Sort by avg accuracy ascending (weakest first) */
  const weak = cards
    .filter((c) => c.status === 'attention_needed' || c.status === 'insufficient_data')
    .sort((a, b) => (a.avg_accuracy ?? 0) - (b.avg_accuracy ?? 0))
    .slice(0, 3);

  for (const c of weak) {
    if (c.status === 'attention_needed') {
      areas.push({
        kind: 'low_accuracy',
        target_domain: c.domain_id,
        target_label: c.domain_label,
        message: lang === 'ar'
          ? `${c.domain_label} محتاجة جلسات تركيز أكتر`
          : `${c.domain_label} needs a few focused sessions`,
        suggested_action: c.games_played.length > 0
          ? (lang === 'ar' ? `العب ${c.games_played[0]}` : `Try ${c.games_played[0]}`)
          : (lang === 'ar' ? 'ابدأ بأي لعبة من المجال ده' : 'Start with any game in this domain'),
      });
    } else if (c.status === 'insufficient_data' && c.sessions_count === 0) {
      areas.push({
        kind: 'domain_gap',
        target_domain: c.domain_id,
        target_label: c.domain_label,
        message: lang === 'ar'
          ? `لسه مالعبتش في ${c.domain_label}`
          : `Haven't tried ${c.domain_label} yet`,
        suggested_action: lang === 'ar' ? 'ابدأ بجلسة قصيرة' : 'Start with a short session',
      });
    }
  }

  /* Stale domains */
  const stale = cards
    .filter((c) => c.sessions_count > 0 && c.last_played_days !== null && c.last_played_days >= STALE_DAYS)
    .sort((a, b) => (b.last_played_days ?? 0) - (a.last_played_days ?? 0))
    .slice(0, 2);

  for (const c of stale) {
    areas.push({
      kind: 'stale_domain',
      target_domain: c.domain_id,
      target_label: c.domain_label,
      message: lang === 'ar'
        ? `${c.domain_label} من فترة مش بتلعبها (${c.last_played_days} يوم)`
        : `${c.domain_label} not played in ${c.last_played_days} days`,
      suggested_action: lang === 'ar' ? 'رجع لها بجلسة خفيفة' : 'Come back with a light session',
    });
  }

  return areas.slice(0, 4);
}

/* ═══════════════════════════════════════════════════════════
   STRENGTHS
   ═══════════════════════════════════════════════════════════ */
function buildStrengths(cards: DomainCard[], lang: Lang): Strength[] {
  const strong = cards
    .filter((c) => c.status === 'strong' && c.avg_accuracy !== null)
    .sort((a, b) => (b.avg_accuracy ?? 0) - (a.avg_accuracy ?? 0))
    .slice(0, 3);

  return strong.map((c) => ({
    domain_id: c.domain_id,
    domain_label: c.domain_label,
    accuracy: c.avg_accuracy ?? 0,
    message: lang === 'ar'
      ? `${c.domain_label}: ${c.avg_accuracy}% — أداء قوي`
      : `${c.domain_label}: ${c.avg_accuracy}% — strong performance`,
  }));
}

/* ═══════════════════════════════════════════════════════════
   NEXT BEST ACTION
   ═══════════════════════════════════════════════════════════ */
async function pickNextBestAction(
  userId: string,
  cards: DomainCard[],
  lang: Lang
): Promise<NextBestAction | null> {
  /* Priority 1: weakness domain, never-played games first */
  const weakDomains = cards
    .filter((c) => c.status === 'attention_needed' || c.sessions_count === 0)
    .sort((a, b) => {
      /* Prefer completely unplayed */
      if (a.sessions_count === 0 && b.sessions_count > 0) return -1;
      if (a.sessions_count > 0 && b.sessions_count === 0) return 1;
      return (a.avg_accuracy ?? 0) - (b.avg_accuracy ?? 0);
    });

  if (weakDomains.length > 0) {
    const target = weakDomains[0]!;
    /* Pick a game from that domain user hasn't played, or less played */
    const gamesRes = await pool.query<{ id: string; name: string }>(
      `SELECT g.id, g.name
         FROM games g
        WHERE g.domain_id = $1 AND g.status = 'ready'
          AND g.id NOT IN (
            SELECT game_id FROM sessions
             WHERE user_id = $2 AND status='accepted' AND deleted_at IS NULL
          )
        ORDER BY RANDOM()
        LIMIT 1`,
      [target.domain_id, userId]
    );

    let gameId: string;
    let gameName: string;

    if (gamesRes.rows[0]) {
      gameId = gamesRes.rows[0].id;
      gameName = gamesRes.rows[0].name;
    } else {
      /* Fallback: any game from that domain */
      const fallback = await pool.query<{ id: string; name: string }>(
        `SELECT id, name FROM games
          WHERE domain_id = $1 AND status = 'ready'
          ORDER BY RANDOM() LIMIT 1`,
        [target.domain_id]
      );
      if (!fallback.rows[0]) return null;
      gameId = fallback.rows[0].id;
      gameName = fallback.rows[0].name;
    }

    return {
      game_id: gameId,
      game_name: gameName,
      domain_id: target.domain_id,
      reason: lang === 'ar'
        ? `تنويع التدريب على ${target.domain_label}`
        : `Broaden your practice in ${target.domain_label}`,
      mode: 'classic',
    };
  }

  /* Priority 2: stale domain */
  const stale = cards
    .filter((c) => c.last_played_days !== null && c.last_played_days >= STALE_DAYS)
    .sort((a, b) => (b.last_played_days ?? 0) - (a.last_played_days ?? 0))[0];

  if (stale) {
    const g = await pool.query<{ id: string; name: string }>(
      `SELECT id, name FROM games
        WHERE domain_id = $1 AND status = 'ready'
        ORDER BY RANDOM() LIMIT 1`,
      [stale.domain_id]
    );
    if (g.rows[0]) {
      return {
        game_id: g.rows[0].id,
        game_name: g.rows[0].name,
        domain_id: stale.domain_id,
        reason: lang === 'ar'
          ? `رجع لـ ${stale.domain_label} من فترة`
          : `Back to ${stale.domain_label} — you haven't played it in a while`,
        mode: 'classic',
      };
    }
  }

  /* Priority 3: variety push */
  const g = await pool.query<{ id: string; name: string; domain_id: string }>(
    `SELECT id, name, domain_id FROM games
      WHERE status = 'ready'
      ORDER BY RANDOM() LIMIT 1`
  );
  if (g.rows[0]) {
    return {
      game_id: g.rows[0].id,
      game_name: g.rows[0].name,
      domain_id: g.rows[0].domain_id,
      reason: lang === 'ar' ? 'تنويع جديد' : 'Try something new',
      mode: 'classic',
    };
  }

  return null;
}

/* ═══════════════════════════════════════════════════════════
   HEADLINE
   ═══════════════════════════════════════════════════════════ */
function buildHeadline(
  sessionsTotal: number,
  daysActive: number,
  cards: DomainCard[],
  lang: Lang
): { headline: string; subline: string | null } {
  if (sessionsTotal === 0) {
    return {
      headline: lang === 'ar' ? 'ابدأ أول جلسة' : 'Start your first session',
      subline: lang === 'ar'
        ? 'لعب دقيقتين هيكفي عشان نبدأ نفهم أداءك.'
        : 'Two minutes is enough to start understanding your patterns.',
    };
  }

  const strongCount = cards.filter((c) => c.status === 'strong').length;
  const improving = cards.filter((c) => c.trend === 'improving').length;
  const attention = cards.filter((c) => c.status === 'attention_needed').length;

  if (sessionsTotal < 5) {
    return {
      headline: lang === 'ar' ? 'صورة بتتكوّن' : 'Your picture is forming',
      subline: lang === 'ar'
        ? `عندك ${sessionsTotal} جلسات لحد دلوقتي. كمّل عشان تتضح أكتر.`
        : `You have ${sessionsTotal} sessions so far. Keep going to see the full picture.`,
    };
  }

  if (improving >= 2) {
    return {
      headline: lang === 'ar' ? 'اتجاهات بتتحسن' : 'Trends moving up',
      subline: lang === 'ar'
        ? `${improving} مجالات بيتحسنوا. استمر.`
        : `${improving} domains trending up. Keep it going.`,
    };
  }

  if (attention >= 2) {
    return {
      headline: lang === 'ar' ? 'نقاط تركيز واضحة' : 'Clear focus areas',
      subline: lang === 'ar'
        ? `${attention} مجالات محتاجة جلسات تركيز.`
        : `${attention} domains could use focused sessions.`,
    };
  }

  if (strongCount >= 3) {
    return {
      headline: lang === 'ar' ? 'أداء قوي ومتوازن' : 'Strong and balanced',
      subline: lang === 'ar'
        ? `${strongCount} مجالات بقوة ${STRONG_THRESHOLD}%+.`
        : `${strongCount} domains are at ${STRONG_THRESHOLD}%+.`,
    };
  }

  return {
    headline: lang === 'ar' ? `${sessionsTotal} جلسات على ${daysActive} يوم` : `${sessionsTotal} sessions over ${daysActive} days`,
    subline: lang === 'ar' ? 'استمر في الإيقاع.' : 'Keep the rhythm.',
  };
}

/* ═══════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════ */
export async function generateSnapshot(
  userId: string,
  lang: Lang = 'en'
): Promise<SnapshotResponse> {
  const [sessions, domainMeta, quickStats, milestones] = await Promise.all([
    loadUserSessions(userId),
    loadDomainMeta(),
    loadQuickStats(userId),
    loadMilestones(userId),
  ]);

  const domainCards = buildDomainCards(sessions, domainMeta, lang);
  const attentionAreas = buildAttentionAreas(domainCards, lang);
  const strengths = buildStrengths(domainCards, lang);
  const nextBestAction = await pickNextBestAction(userId, domainCards, lang);

  const { headline, subline } = buildHeadline(
    quickStats.total_sessions,
    quickStats.days_active,
    domainCards,
    lang
  );

  const evidenceTier: OverallSummary['evidence_tier'] =
    quickStats.total_sessions < 5
      ? 'calibrating'
      : quickStats.total_sessions < 20
        ? 'provisional'
        : 'established';

  return {
    user_id: userId,
    generated_at: new Date().toISOString(),
    overall: {
      sessions_total: quickStats.total_sessions,
      days_active: quickStats.days_active,
      evidence_tier: evidenceTier,
      headline,
      subline,
    },
    domain_cards: domainCards,
    attention_areas: attentionAreas,
    strengths,
    recent_milestones: milestones,
    next_best_action: nextBestAction,
    quick_stats: quickStats,
    language: lang,
  };
}