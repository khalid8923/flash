/* ═══════════════════════════════════════════════════════════
   Transfer Tracker Service
   Detects correlations between daily performance across domains.
   Rule: Pearson correlation is deterministic. LLM phrases only.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';
import { routeChat } from './router.js';
import { validateAiText } from './validator.js';
import {
  SYSTEM_PROMPT_TRANSFER_EN,
  SYSTEM_PROMPT_TRANSFER_AR,
  buildTransferPrompt,
  domainLabel,
  strengthLabel,
  type TransferSignal,
  type Lang,
} from './prompts-transfer-tracker.js';

/* ─── Result ─── */
export interface TransferTrackerResult {
  signals: Array<{
    source_domain: string;
    target_domain: string;
    source_label: string;
    target_label: string;
    correlation: number;
    strength: 'strong' | 'moderate' | 'weak';
    direction: 'positive' | 'negative';
    sample_days: number;
    slope: number;
    evidence: string;
  }>;
  insights: string;
  analyzed_days: number;
  total_sessions: number;
  source: 'llm' | 'rule' | 'insufficient_data';
  provider: string;
  model: string;
  language: Lang;
  latency_ms: number;
  tokens?: { prompt: number; completion: number; total: number };
  message?: string;
}

const MIN_DAYS = 5;
const MIN_DOMAINS = 3;
const MIN_R = 0.4;
const WINDOW_DAYS = 60;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

/* In-memory cache */
const memCache = new Map<string, { result: TransferTrackerResult; ts: number }>();

function cacheKey(userId: string, lang: Lang): string {
  return `${userId}:${lang}`;
}

/* ═══════════════════════════════════════════════════════════
   DATA LOADING
   ═══════════════════════════════════════════════════════════ */
interface DayDomainRow {
  day: string;         // YYYY-MM-DD
  domain_id: string;
  avg_acc: number;
  sessions_count: number;
}

async function loadDailyDomainAccuracy(
  userId: string,
  days: number
): Promise<{ rows: DayDomainRow[]; totalSessions: number }> {
  const res = await pool.query<{
    day: string;
    domain_id: string;
    avg_acc: number;
    sessions_count: number;
  }>(
    `SELECT TO_CHAR(DATE(s.ended_at), 'YYYY-MM-DD') AS day,
            g.domain_id,
            AVG(s.accuracy)::float AS avg_acc,
            COUNT(*)::int AS sessions_count
       FROM sessions s
       JOIN games g ON g.id = s.game_id
      WHERE s.user_id = $1
        AND s.status = 'accepted'
        AND s.deleted_at IS NULL
        AND s.ended_at >= NOW() - ($2 || ' days')::interval
      GROUP BY DATE(s.ended_at), g.domain_id
      ORDER BY day ASC`,
    [userId, String(days)]
  );

  const totalSessions = res.rows.reduce((sum, r) => sum + r.sessions_count, 0);

  return { rows: res.rows, totalSessions };
}

/* ═══════════════════════════════════════════════════════════
   MATH — Pearson correlation
   ═══════════════════════════════════════════════════════════ */
function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;

  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const mx = mean(xs);
  const my = mean(ys);

  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i]! - mx;
    const dy = ys[i]! - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  if (denom === 0) return 0;
  return num / denom;
}

/* Simple slope: avg(dy) / avg(dx) across paired diffs */
function estimateSlope(xs: number[], ys: number[]): number {
  if (xs.length < 2) return 0;
  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i]! - mx;
    num += dx * (ys[i]! - my);
    den += dx * dx;
  }
  if (den === 0) return 0;
  return num / den;
}

/* ═══════════════════════════════════════════════════════════
   BUILD PAIRED SERIES
   ═══════════════════════════════════════════════════════════ */
function buildDomainSeries(rows: DayDomainRow[]): Map<string, Map<string, number>> {
  /* domain -> day -> accuracy */
  const map = new Map<string, Map<string, number>>();
  for (const r of rows) {
    if (!map.has(r.domain_id)) map.set(r.domain_id, new Map());
    map.get(r.domain_id)!.set(r.day, r.avg_acc);
  }
  return map;
}

function detectSignals(rows: DayDomainRow[], totalSessions: number): {
  signals: TransferSignal[];
  analyzedDays: number;
} {
  const series = buildDomainSeries(rows);
  const domains = Array.from(series.keys());

  /* Days are always counted accurately regardless of domain count */
  const analyzedDays = new Set(rows.map((r) => r.day)).size;

  /* Need at least 3 domains with data */
  if (domains.length < MIN_DOMAINS) {
    return { signals: [], analyzedDays };
  }

  const signals: TransferSignal[] = [];

  for (const src of domains) {
    for (const tgt of domains) {
      if (src === tgt) continue;

      const srcSeries = series.get(src)!;
      const tgtSeries = series.get(tgt)!;

      /* Find days where both have data */
      const xs: number[] = [];
      const ys: number[] = [];
      for (const [day, val] of srcSeries.entries()) {
        if (tgtSeries.has(day)) {
          xs.push(val);
          ys.push(tgtSeries.get(day)!);
        }
      }

      if (xs.length < MIN_DAYS) continue;

      const r = pearson(xs, ys);
      if (Math.abs(r) < MIN_R) continue;

      const slope = estimateSlope(xs, ys);

      signals.push({
        source_domain: src,
        target_domain: tgt,
        correlation: Math.round(r * 1000) / 1000,
        sample_days: xs.length,
        slope: Math.round(slope * 100) / 100,
      });
    }
  }

  /* Sort by |r| desc */
  signals.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  /* Drop mirror pairs (A→B and B→A with same r) — keep higher sample */
  const seen = new Set<string>();
  const deduped: TransferSignal[] = [];
  for (const s of signals) {
    const key = [s.source_domain, s.target_domain].sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(s);
  }

  /* Top 5 */
  return {
    signals: deduped.slice(0, 5),
    analyzedDays,
  };
}

/* ═══════════════════════════════════════════════════════════
   FALLBACK
   ═══════════════════════════════════════════════════════════ */
function buildFallback(
  signals: TransferSignal[],
  analyzedDays: number,
  lang: Lang
): string {
  if (signals.length === 0) {
    return lang === 'ar'
      ? `حللنا ${analyzedDays} يوم — مفيش ارتباط واضح بين المجالات لحد دلوقتي.`
      : `Analyzed ${analyzedDays} days — no clear cross-domain correlation yet.`;
  }
  const top = signals[0]!;
  const src = domainLabel(top.source_domain, lang);
  const tgt = domainLabel(top.target_domain, lang);
  const dir = top.correlation > 0 ? (lang === 'ar' ? 'إيجابي' : 'positive') : (lang === 'ar' ? 'سلبي' : 'negative');
  const r = top.correlation.toFixed(2);
  if (lang === 'ar') {
    return `أبرز ارتباط: ${src} → ${tgt} (r=${r} ${dir}). لما ${src} بيتحسن، ${tgt} بيميل يتحسن كمان. راقب النمط في الجلسات الجاية.`;
  }
  return `Top correlation: ${src} → ${tgt} (r=${r} ${dir}). When ${src} improves, ${tgt} tends to improve alongside. Keep an eye on this pattern.`;
}

/* ═══════════════════════════════════════════════════════════
   PERSIST
   ═══════════════════════════════════════════════════════════ */
async function persistSignals(userId: string, signals: TransferSignal[]): Promise<void> {
  if (signals.length === 0) return;
  try {
    for (const s of signals) {
      await pool.query(
        `INSERT INTO transfer_signals
           (user_id, source_domain, target_domain, correlation, confidence, evidence_count)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, source_domain, target_domain)
         DO UPDATE SET correlation = EXCLUDED.correlation,
                       confidence = EXCLUDED.confidence,
                       evidence_count = EXCLUDED.evidence_count,
                       computed_at = NOW()`,
        [
          userId,
          s.source_domain,
          s.target_domain,
          s.correlation,
          Math.min(1, Math.abs(s.correlation)),
          s.sample_days,
        ]
      );
    }
  } catch (err) {
    console.warn('[transfer] persist failed:', (err as Error).message);
  }
}

/* ═══════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════ */
export async function generateTransferInsights(
  userId: string,
  language: Lang = 'en',
  forceRefresh = false
): Promise<TransferTrackerResult> {
  const started = Date.now();

  /* Cache */
  if (!forceRefresh) {
    const key = cacheKey(userId, language);
    const hit = memCache.get(key);
    if (hit && Date.now() - hit.ts < CACHE_TTL_MS) {
      return { ...hit.result, latency_ms: 0 };
    }
  }

  /* Load */
  const { rows, totalSessions } = await loadDailyDomainAccuracy(userId, WINDOW_DAYS);

  /* Detect */
  const { signals, analyzedDays } = detectSignals(rows, totalSessions);

  /* Insufficient data check */
  if (analyzedDays < MIN_DAYS || signals.length === 0) {
    const result: TransferTrackerResult = {
      signals: [],
      insights:
        language === 'ar'
          ? `لسه بدري — محتاجين ${MIN_DAYS} أيام على الأقل مع ${MIN_DOMAINS} مجالات. عندك ${analyzedDays} يوم.`
          : `Not enough data yet — need at least ${MIN_DAYS} days across ${MIN_DOMAINS} domains. You have ${analyzedDays} days.`,
      analyzed_days: analyzedDays,
      total_sessions: totalSessions,
      source: 'insufficient_data',
      provider: 'none',
      model: 'none',
      language,
      latency_ms: Date.now() - started,
      message: language === 'ar' ? 'لسه بدري' : 'Not enough data',
    };
    memCache.set(cacheKey(userId, language), { result, ts: Date.now() });
    return result;
  }

  /* LLM phrasing */
  let insights = '';
  let source: TransferTrackerResult['source'] = 'llm';
  let provider = '';
  let model = '';
  let tokens: TransferTrackerResult['tokens'];

  const systemPrompt =
    language === 'ar' ? SYSTEM_PROMPT_TRANSFER_AR : SYSTEM_PROMPT_TRANSFER_EN;
  const userPrompt = buildTransferPrompt(signals, analyzedDays, language);

  try {
    const res = await routeChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.5, max_tokens: 600, language }
    );

    const check = validateAiText(res.content, { minLen: 50, maxLen: 1200 });
    if (check.ok) {
      insights = check.cleaned;
      provider = res.provider;
      model = res.model;
      tokens = {
        prompt: res.usage.prompt_tokens,
        completion: res.usage.completion_tokens,
        total: res.usage.total_tokens,
      };
    } else {
      console.error('[transfer] validation failed:', JSON.stringify(check.issues));
      insights = buildFallback(signals, analyzedDays, language);
      source = 'rule';
      provider = 'none';
      model = 'rule';
    }
  } catch (err) {
    console.error('[transfer] LLM failed:', (err as Error).message);
    insights = buildFallback(signals, analyzedDays, language);
    source = 'rule';
    provider = 'none';
    model = 'rule';
  }

  /* Persist */
  await persistSignals(userId, signals);

  /* Build response signals */
  const responseSignals = signals.map((s) => {
    const srcLabel = domainLabel(s.source_domain, language);
    const tgtLabel = domainLabel(s.target_domain, language);
    const strength = strengthLabel(s.correlation, language);
    const direction: 'positive' | 'negative' = s.correlation >= 0 ? 'positive' : 'negative';
    const srcLabelDisplay = srcLabel;
    const tgtLabelDisplay = tgtLabel;

    let evidence: string;
    if (language === 'ar') {
      const dirW = s.correlation >= 0 ? 'بيتحسن مع' : 'بيقل مع';
      evidence = `لما ${srcLabelDisplay} يتحسن، ${tgtLabelDisplay} ${dirW} (r=${s.correlation.toFixed(2)}، ${s.sample_days} يوم)`;
    } else {
      const dirW = s.correlation >= 0 ? 'improves alongside' : 'drops alongside';
      evidence = `When ${srcLabelDisplay} improves, ${tgtLabelDisplay} ${dirW} (r=${s.correlation.toFixed(2)}, ${s.sample_days} days)`;
    }

    return {
      source_domain: s.source_domain,
      target_domain: s.target_domain,
      source_label: srcLabel,
      target_label: tgtLabel,
      correlation: s.correlation,
      strength,
      direction,
      sample_days: s.sample_days,
      slope: s.slope,
      evidence,
    };
  });

  const result: TransferTrackerResult = {
    signals: responseSignals,
    insights,
    analyzed_days: analyzedDays,
    total_sessions: totalSessions,
    source,
    provider,
    model,
    language,
    latency_ms: Date.now() - started,
    tokens,
  };

  memCache.set(cacheKey(userId, language), { result, ts: Date.now() });
  return result;
}