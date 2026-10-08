/* ═══════════════════════════════════════════════════════════
   Cognitive Fingerprint Service
   Flow: load facts -> pick archetype -> Groq -> validate -> store
   Rule: rule-based classification. LLM phrases only.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';
import { routeChat } from './router.js';
import {
  SYSTEM_PROMPT_FINGERPRINT_EN,
  SYSTEM_PROMPT_FINGERPRINT_AR,
  buildFingerprintUserPrompt,
  archetypeLabel,
  modifierLabel,
  type FingerprintFactSheet,
  type Archetype,
  type Modifier,
  type Lang,
} from './prompts-fingerprint.js';
import { validateAiText } from './validator.js';

export interface FingerprintResult {
  archetype: Archetype;
  archetype_label: string;
  modifiers: Modifier[];
  modifier_labels: string[];
  summary: string;
  traits: {
    avg_accuracy: number;
    median_rt_ms: number;
    rt_std_ms: number;
    accuracy_slope: number;
    top_domain: string | null;
    top_domain_accuracy: number | null;
    weakest_domain: string | null;
    weakest_domain_accuracy: number | null;
    unique_games_played: number;
    domains_touched: number;
  };
  evidence_tier: 'calibrating' | 'provisional' | 'established';
  confidence: number;
  sessions_used: number;
  source: 'llm' | 'rule' | 'cache' | 'insufficient_data';
  language: Lang;
  model: string;
  provider: string;
  latency_ms: number;
  message?: string;
}

const MIN_SESSIONS = 3;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/* --- Compute stats from sessions --- */
interface RawStats {
  sessions_count: number;
  avg_accuracy: number;
  median_rt_ms: number;
  rt_std_ms: number;
  accuracy_slope: number;
  unique_games_played: number;
  domains_touched: number;
  top_domain: string | null;
  top_domain_accuracy: number | null;
  weakest_domain: string | null;
  weakest_domain_accuracy: number | null;
  domain_std: number;
}

async function loadRawStats(userId: string): Promise<RawStats> {
  const statsRes = await pool.query<{
    total: number;
    avg_acc: number | null;
    median_rt: number | null;
    rt_std: number | null;
    unique_games: number;
    domains: number;
  }>(
    `SELECT
       COUNT(*)::int AS total,
       AVG(accuracy)::float AS avg_acc,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY median_rt_ms)::float AS median_rt,
       STDDEV(median_rt_ms)::float AS rt_std,
       COUNT(DISTINCT game_id)::int AS unique_games,
       COUNT(DISTINCT domain_id)::int AS domains
     FROM sessions
     WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL`,
    [userId]
  );
  const s = statsRes.rows[0];

  /* Domain breakdown */
  const domRes = await pool.query<{ domain_id: string; avg_acc: number; n: number }>(
    `SELECT domain_id, AVG(accuracy)::float AS avg_acc, COUNT(*)::int AS n
     FROM sessions
     WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL
     GROUP BY domain_id
     HAVING COUNT(*) >= 1
     ORDER BY avg_acc DESC`,
    [userId]
  );
  const topDom = domRes.rows[0] ?? null;
  const lastDom = domRes.rows[domRes.rows.length - 1] ?? null;
  const weakDom = topDom && lastDom && topDom.domain_id === lastDom.domain_id ? null : lastDom;

  /* domain std */
  let domainStd = 0;
  if (domRes.rows.length >= 2) {
    const vals = domRes.rows.map((r) => r.avg_acc);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
    domainStd = Math.sqrt(variance);
  }

  /* accuracy slope: first 5 vs last 5 sessions */
  const slopeRes = await pool.query<{ accuracy: number; ended_at: string }>(
    `SELECT accuracy, ended_at FROM sessions
     WHERE user_id = $1 AND status='accepted' AND deleted_at IS NULL
     ORDER BY ended_at ASC`,
    [userId]
  );
  let slope = 0;
  if (slopeRes.rows.length >= 4) {
    const half = Math.floor(slopeRes.rows.length / 2);
    const firstHalf = slopeRes.rows.slice(0, half);
    const lastHalf = slopeRes.rows.slice(-half);
    const avgFirst = firstHalf.reduce((a, r) => a + r.accuracy, 0) / firstHalf.length;
    const avgLast = lastHalf.reduce((a, r) => a + r.accuracy, 0) / lastHalf.length;
    slope = (avgLast - avgFirst) / Math.max(1, half);
  }

  return {
    sessions_count: s.total ?? 0,
    avg_accuracy: s.avg_acc ?? 0,
    median_rt_ms: s.median_rt ?? 0,
    rt_std_ms: s.rt_std ?? 0,
    accuracy_slope: Math.round(slope * 100) / 100,
    unique_games_played: s.unique_games ?? 0,
    domains_touched: s.domains ?? 0,
    top_domain: topDom?.domain_id ?? null,
    top_domain_accuracy: topDom?.avg_acc ?? null,
    weakest_domain: weakDom?.domain_id ?? null,
    weakest_domain_accuracy: weakDom?.avg_acc ?? null,
    domain_std: Math.round(domainStd * 100) / 100,
  };
}

/* --- Pick archetype --- */
function pickArchetype(s: RawStats): Archetype {
  const acc = s.avg_accuracy;
  const rt = s.median_rt_ms;

  /* Priority 1: Specialist (uneven domains) */
  const spread = (s.top_domain_accuracy ?? 0) - (s.weakest_domain_accuracy ?? 0);
  if (s.domains_touched >= 3 && spread >= 20 && s.domain_std >= 8) {
    return 'specialist';
  }

  /* Priority 2: Explorer (broad variety) */
  if (s.unique_games_played >= 20 && s.domains_touched >= 6) {
    return 'explorer';
  }

  /* Priority 3: RT × Accuracy matrix */
  const isFast = rt > 0 && rt < 700;
  const isSlow = rt > 1200;
  const isHighAcc = acc >= 80;
  const isLowAcc = acc < 65;

  if (isFast && isHighAcc) return 'sharp_shooter';
  if (isFast && isLowAcc) return 'impulsive';
  if (isSlow && isHighAcc) return 'methodical';
  if (isSlow && isLowAcc) return 'cautious';
  if (isHighAcc) return 'balanced';
  return 'exploring';
}

/* --- Pick modifiers --- */
function pickModifiers(s: RawStats): Modifier[] {
  const mods: Modifier[] = [];
  if (s.accuracy_slope >= 0.3) mods.push('learner');
  if (Math.abs(s.accuracy_slope) < 0.1 && s.sessions_count >= 10) mods.push('plateaued');
  if (s.rt_std_ms > 400) mods.push('variable');
  if (s.domain_std < 5 && s.sessions_count >= 15) mods.push('specialist');
  if (s.domain_std > 12) mods.push('generalist');
  return mods;
}

/* --- Confidence (0-1) --- */
function computeConfidence(s: RawStats): number {
  const sessionScore = Math.min(1, s.sessions_count / 30);
  const domainScore = Math.min(1, s.domains_touched / 6);
  const gameScore = Math.min(1, s.unique_games_played / 15);
  return Math.round(((sessionScore * 0.5) + (domainScore * 0.3) + (gameScore * 0.2)) * 100) / 100;
}

/* --- Evidence tier --- */
function computeTier(sessions: number): FingerprintFactSheet['evidence_tier'] {
  if (sessions < 5) return 'calibrating';
  if (sessions < 20) return 'provisional';
  return 'established';
}

/* --- Deterministic fallback summary --- */
function buildFallbackSummary(f: FingerprintFactSheet, lang: Lang): string {
  const name = archetypeLabel(f.archetype, lang);
  if (lang === 'ar') {
    return `بصمتك المعرفية: ${name}. متوسط دقتك ${Math.round(f.avg_accuracy)}% ومتوسط زمن ردك ${Math.round(f.median_rt_ms)} مللي ثانية عبر ${f.sessions_used} جلسة. أقوى مجال: ${f.top_domain ?? '-'}، وأضعف مجال: ${f.weakest_domain ?? '-'}.`;
  }
  return `Your cognitive fingerprint: ${name}. Average accuracy ${Math.round(f.avg_accuracy)}% with a median RT of ${Math.round(f.median_rt_ms)}ms across ${f.sessions_used} sessions. Strongest domain: ${f.top_domain ?? '-'}. Weakest: ${f.weakest_domain ?? '-'}.`;
}

/* ═══════════════════════════════════════════════════════════
   Main
   ═══════════════════════════════════════════════════════════ */
export async function generateFingerprint(
  userId: string,
  language: Lang = 'en',
  forceRefresh = false
): Promise<FingerprintResult> {
  const started = Date.now();

  /* 1) Cache check */
  if (!forceRefresh) {
    const cached = await pool.query<{
      archetype: string;
      summary: string;
      traits: Record<string, unknown>;
      confidence: number;
      sessions_used: number;
      generated_at: string;
    }>(
      `SELECT archetype, summary, traits, confidence, sessions_used, generated_at
         FROM cognitive_fingerprints
        WHERE user_id = $1
        ORDER BY generated_at DESC
        LIMIT 1`,
      [userId]
    );
    const row = cached.rows[0];
    const cacheLang = row ? ((row.traits as Record<string, unknown>).language as string | undefined) : undefined;
    if (row && cacheLang === language) {
      const age = Date.now() - new Date(row.generated_at).getTime();
      if (age < CACHE_TTL_MS) {
        const arch = row.archetype as Archetype;
        const mods = (row.traits.modifiers as Modifier[]) ?? [];
        return {
          archetype: arch,
          archetype_label: archetypeLabel(arch, language),
          modifiers: mods,
          modifier_labels: mods.map((m) => modifierLabel(m, language)),
          summary: row.summary,
          traits: {
            avg_accuracy: (row.traits.avg_accuracy as number) ?? 0,
            median_rt_ms: (row.traits.median_rt_ms as number) ?? 0,
            rt_std_ms: (row.traits.rt_std_ms as number) ?? 0,
            accuracy_slope: (row.traits.accuracy_slope as number) ?? 0,
            top_domain: (row.traits.top_domain as string | null) ?? null,
            top_domain_accuracy: (row.traits.top_domain_accuracy as number | null) ?? null,
            weakest_domain: (row.traits.weakest_domain as string | null) ?? null,
            weakest_domain_accuracy: (row.traits.weakest_domain_accuracy as number | null) ?? null,
            unique_games_played: (row.traits.unique_games_played as number) ?? 0,
            domains_touched: (row.traits.domains_touched as number) ?? 0,
          },
          evidence_tier: computeTier(row.sessions_used),
          confidence: row.confidence,
          sessions_used: row.sessions_used,
          source: 'cache',
          language,
          model: 'cache',
          provider: 'none',
          latency_ms: Date.now() - started,
        };
      }
    }
  }

  /* 2) Load raw stats */
  const stats = await loadRawStats(userId);

  if (stats.sessions_count < MIN_SESSIONS) {
    const arch: Archetype = 'exploring';
    return {
      archetype: arch,
      archetype_label: archetypeLabel(arch, language),
      modifiers: [],
      modifier_labels: [],
      summary:
        language === 'ar'
          ? `لسه بدري — محتاجين ${MIN_SESSIONS} جلسات على الأقل لبناء بصمتك المعرفية. لسه عندك ${stats.sessions_count}.`
          : `Still forming — need at least ${MIN_SESSIONS} sessions to build your cognitive fingerprint. You have ${stats.sessions_count}.`,
      traits: {
        avg_accuracy: stats.avg_accuracy,
        median_rt_ms: stats.median_rt_ms,
        rt_std_ms: stats.rt_std_ms,
        accuracy_slope: stats.accuracy_slope,
        top_domain: stats.top_domain,
        top_domain_accuracy: stats.top_domain_accuracy,
        weakest_domain: stats.weakest_domain,
        weakest_domain_accuracy: stats.weakest_domain_accuracy,
        unique_games_played: stats.unique_games_played,
        domains_touched: stats.domains_touched,
      },
      evidence_tier: 'calibrating',
      confidence: computeConfidence(stats),
      sessions_used: stats.sessions_count,
      source: 'insufficient_data',
      language,
      model: 'none',
      provider: 'none',
      latency_ms: Date.now() - started,
      message:
        language === 'ar'
          ? 'لسه بدري — العب شوية كمان'
          : 'Not enough data yet — keep playing',
    };
  }

  /* 3) Classify */
  const archetype = pickArchetype(stats);
  const modifiers = pickModifiers(stats);
  const tier = computeTier(stats.sessions_count);
  const confidence = computeConfidence(stats);

  const sheet: FingerprintFactSheet = {
    archetype,
    modifiers,
    sessions_used: stats.sessions_count,
    evidence_tier: tier,
    avg_accuracy: stats.avg_accuracy,
    median_rt_ms: stats.median_rt_ms,
    rt_std_ms: stats.rt_std_ms,
    accuracy_slope: stats.accuracy_slope,
    top_domain: stats.top_domain,
    top_domain_accuracy: stats.top_domain_accuracy,
    weakest_domain: stats.weakest_domain,
    weakest_domain_accuracy: stats.weakest_domain_accuracy,
    unique_games_played: stats.unique_games_played,
    domains_touched: stats.domains_touched,
  };

  /* 4) LLM phrasing */
  const systemPrompt =
    language === 'ar' ? SYSTEM_PROMPT_FINGERPRINT_AR : SYSTEM_PROMPT_FINGERPRINT_EN;
  const userPrompt = buildFingerprintUserPrompt(sheet, language);

  let summary = '';
  let usedModel = '';
  let usedProvider = '';
  let source: FingerprintResult['source'] = 'llm';

  try {
    const res = await routeChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.55, max_tokens: 500, language }
    );
    const check = validateAiText(res.content, { minLen: 60, maxLen: 1200 });
    if (check.ok) {
      summary = check.cleaned;
      usedModel = res.model;
      usedProvider = res.provider;
      console.error('[fingerprint] provider=' + usedProvider, 'model=' + usedModel, 'chain=' + res.fallback_chain.join('>'));
    } else {
      summary = buildFallbackSummary(sheet, language);
      source = 'rule';
      usedModel = 'fallback';
      usedProvider = 'none';
    }
  } catch (err) {
    console.error('[fingerprint] all providers failed:', (err as Error).message);
    console.error('[fingerprint] lang=', language);
    summary = buildFallbackSummary(sheet, language);
    source = 'rule';
    usedModel = 'fallback';
    usedProvider = 'none';
  }

  /* 5) Store */
  try {
    await pool.query(
      `INSERT INTO cognitive_fingerprints (user_id, archetype, summary, traits, confidence, sessions_used)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        archetype,
        summary,
        JSON.stringify({
          language,
          modifiers,
          avg_accuracy: stats.avg_accuracy,
          median_rt_ms: stats.median_rt_ms,
          rt_std_ms: stats.rt_std_ms,
          accuracy_slope: stats.accuracy_slope,
          top_domain: stats.top_domain,
          top_domain_accuracy: stats.top_domain_accuracy,
          weakest_domain: stats.weakest_domain,
          weakest_domain_accuracy: stats.weakest_domain_accuracy,
          unique_games_played: stats.unique_games_played,
          domains_touched: stats.domains_touched,
        }),
        confidence,
        stats.sessions_count,
      ]
    );
  } catch (err) {
    console.warn('[fingerprint] store failed:', (err as Error).message);
  }

  return {
    archetype,
    archetype_label: archetypeLabel(archetype, language),
    modifiers,
    modifier_labels: modifiers.map((m) => modifierLabel(m, language)),
    summary,
    traits: {
      avg_accuracy: Math.round(stats.avg_accuracy * 10) / 10,
      median_rt_ms: Math.round(stats.median_rt_ms),
      rt_std_ms: Math.round(stats.rt_std_ms),
      accuracy_slope: stats.accuracy_slope,
      top_domain: stats.top_domain,
      top_domain_accuracy: stats.top_domain_accuracy ? Math.round(stats.top_domain_accuracy * 10) / 10 : null,
      weakest_domain: stats.weakest_domain,
      weakest_domain_accuracy: stats.weakest_domain_accuracy ? Math.round(stats.weakest_domain_accuracy * 10) / 10 : null,
      unique_games_played: stats.unique_games_played,
      domains_touched: stats.domains_touched,
    },
    evidence_tier: tier,
    confidence,
    sessions_used: stats.sessions_count,
    source,
    language,
    model: usedModel,
    provider: usedProvider,
    latency_ms: Date.now() - started,
  };
}