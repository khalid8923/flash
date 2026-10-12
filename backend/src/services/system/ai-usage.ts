/* ═══════════════════════════════════════════════════════════
   FLASH - AI Usage Ledger (R16)
   Append-only log + budget summary per feature/user/day.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';

const GROQ_COST_IN  = 0.15 / 1_000_000; // per token
const GROQ_COST_OUT = 0.60 / 1_000_000;

export interface LogUsageParams {
  feature: string;
  provider: string;
  model: string;
  language?: string;
  userId?: string | null;
  tokensPrompt?: number;
  tokensCompletion?: number;
  latencyMs?: number;
  outcome?: string;
}

export function estimateCost(prompt: number, completion: number): number {
  return +(prompt * GROQ_COST_IN + completion * GROQ_COST_OUT).toFixed(6);
}

export async function logUsage(p: LogUsageParams): Promise<void> {
  const prompt = p.tokensPrompt ?? 0;
  const completion = p.tokensCompletion ?? 0;
  const cost = estimateCost(prompt, completion);
  try {
    await pool.query(
      `INSERT INTO ai_provider_usage
        (feature, provider, model, language, user_id,
         tokens_prompt, tokens_completion, tokens_total, cost_usd, latency_ms, outcome)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        p.feature, p.provider, p.model, p.language ?? null, p.userId ?? null,
        prompt, completion, prompt + completion, cost, p.latencyMs ?? 0,
        p.outcome ?? 'ok',
      ]
    );
  } catch {
    /* silent — logging must not break the caller */
  }
}

export interface BudgetSummary {
  window_days: number;
  total_calls: number;
  total_tokens: number;
  total_cost_usd: number;
  by_feature: Array<{ feature: string; calls: number; tokens: number; cost_usd: number }>;
  by_provider: Array<{ provider: string; calls: number; tokens: number; cost_usd: number }>;
  by_day: Array<{ day: string; calls: number; tokens: number; cost_usd: number }>;
  top_users: Array<{ user_id: string; calls: number; tokens: number; cost_usd: number }>;
}

export async function getBudgetSummary(days = 7): Promise<BudgetSummary> {
  const win = String(days);
  const [total, byFeature, byProvider, byDay, topUsers] = await Promise.all([
    pool.query<{ calls: number; tokens: number; cost: number }>(
      `SELECT COUNT(*)::int AS calls,
              COALESCE(SUM(tokens_total),0)::bigint AS tokens,
              COALESCE(SUM(cost_usd),0)::float AS cost
         FROM ai_provider_usage
        WHERE created_at > NOW() - ($1 || ' days')::interval`,
      [win]
    ),
    pool.query<{ feature: string; calls: number; tokens: number; cost: number }>(
      `SELECT feature, COUNT(*)::int AS calls,
              COALESCE(SUM(tokens_total),0)::bigint AS tokens,
              COALESCE(SUM(cost_usd),0)::float AS cost
         FROM ai_provider_usage
        WHERE created_at > NOW() - ($1 || ' days')::interval
        GROUP BY feature ORDER BY cost DESC LIMIT 20`,
      [win]
    ),
    pool.query<{ provider: string; calls: number; tokens: number; cost: number }>(
      `SELECT provider, COUNT(*)::int AS calls,
              COALESCE(SUM(tokens_total),0)::bigint AS tokens,
              COALESCE(SUM(cost_usd),0)::float AS cost
         FROM ai_provider_usage
        WHERE created_at > NOW() - ($1 || ' days')::interval
        GROUP BY provider ORDER BY cost DESC`,
      [win]
    ),
    pool.query<{ day: string; calls: number; tokens: number; cost: number }>(
      `SELECT TO_CHAR(DATE(created_at),'YYYY-MM-DD') AS day,
              COUNT(*)::int AS calls,
              COALESCE(SUM(tokens_total),0)::bigint AS tokens,
              COALESCE(SUM(cost_usd),0)::float AS cost
         FROM ai_provider_usage
        WHERE created_at > NOW() - ($1 || ' days')::interval
        GROUP BY DATE(created_at) ORDER BY 1 DESC`,
      [win]
    ),
    pool.query<{ user_id: string; calls: number; tokens: number; cost: number }>(
      `SELECT user_id::text, COUNT(*)::int AS calls,
              COALESCE(SUM(tokens_total),0)::bigint AS tokens,
              COALESCE(SUM(cost_usd),0)::float AS cost
         FROM ai_provider_usage
        WHERE created_at > NOW() - ($1 || ' days')::interval AND user_id IS NOT NULL
        GROUP BY user_id ORDER BY cost DESC LIMIT 10`,
      [win]
    ),
  ]);

  return {
    window_days: days,
    total_calls: total.rows[0]?.calls ?? 0,
    total_tokens: Number(total.rows[0]?.tokens ?? 0),
    total_cost_usd: +(total.rows[0]?.cost ?? 0).toFixed(4),
    by_feature: byFeature.rows.map((r) => ({ feature: r.feature, calls: r.calls, tokens: Number(r.tokens), cost_usd: +(r.cost).toFixed(4) })),
    by_provider: byProvider.rows.map((r) => ({ provider: r.provider, calls: r.calls, tokens: Number(r.tokens), cost_usd: +(r.cost).toFixed(4) })),
    by_day: byDay.rows.map((r) => ({ day: r.day, calls: r.calls, tokens: Number(r.tokens), cost_usd: +(r.cost).toFixed(4) })),
    top_users: topUsers.rows.map((r) => ({ user_id: r.user_id, calls: r.calls, tokens: Number(r.tokens), cost_usd: +(r.cost).toFixed(4) })),
  };
}