/* ═══════════════════════════════════════════════════════════
   AI Router — Multi-provider failover with circuit breaker
   Order: Groq -> OpenRouter -> Gemini
   Records health per provider; skips unhealthy ones.
   Supports language-aware model selection per provider.
   ═══════════════════════════════════════════════════════════ */

import { groqProvider } from './providers/groq-provider.js';
import { openrouterProvider } from './providers/openrouter-provider.js';
import { geminiProvider } from './providers/gemini-provider.js';
import { isHealthy, recordSuccess, recordFailure, getHealthReport } from './health.js';
import type { AIProvider, AIMessage, AIOptions, AIResult, Lang } from './providers/types.js';
import { env } from '../../config/env.js';

/* Provider priority order */
const PROVIDERS: AIProvider[] = [groqProvider, openrouterProvider, geminiProvider];

export interface RouteOptions extends AIOptions {
  /** Language hint — used to pick the best model per provider */
  language?: Lang;
  /** Providers already attempted (used internally by routeChat) */
  exclude?: string[];
}

export interface RouteResult extends AIResult {
  fallback_chain: string[];
}

/* ─── Model picker per provider ─── */
function pickModel(providerName: string, language: Lang | undefined, explicitModel?: string): string | undefined {
  if (explicitModel) return explicitModel;

  if (providerName === 'groq') {
    if (language === 'ar') return env.GROQ_MODEL_AR;
    return env.GROQ_MODEL_EN;
  }

  if (providerName === 'openrouter') {
    return env.OPENROUTER_MODEL; // 'meta-llama/llama-3.3-70b-instruct:free'
  }

  if (providerName === 'gemini') {
    return env.GEMINI_MODEL; // 'gemini-2.0-flash'
  }

  return undefined;
}

/**
 * Route a chat request through available providers.
 * Tries in priority order, skipping unhealthy ones.
 * Throws if all providers fail.
 */
export async function routeChat(
  messages: AIMessage[],
  opts: RouteOptions = {}
): Promise<RouteResult> {
  const exclude = new Set(opts.exclude ?? []);
  const attempted: string[] = [];
  const errors: string[] = [];

  for (const provider of PROVIDERS) {
    if (exclude.has(provider.name)) continue;
    if (!provider.isEnabled()) continue;
    if (!isHealthy(provider.name)) {
      errors.push(`${provider.name}: unhealthy (cooldown)`);
      continue;
    }

    const model = pickModel(provider.name, opts.language, opts.model);
    attempted.push(provider.name);

    console.error(
      '[router] trying provider=' + provider.name,
      '| model=' + (model || '(default)'),
      '| lang=' + (opts.language || 'n/a')
    );

    try {
      const result = await provider.chat(messages, {
        temperature: opts.temperature,
        max_tokens: opts.max_tokens,
        json_mode: opts.json_mode,
        model,
      });

      if (!result.content || result.content.trim().length === 0) {
        throw new Error('empty response');
      }

      console.error('[router] SUCCESS via', provider.name, '| len:', result.content.length);
      recordSuccess(provider.name);
      return {
        ...result,
        fallback_chain: attempted,
      };
    } catch (err) {
      const msg = (err as Error).message;
      console.error('[router] FAILED via', provider.name, ':', msg.slice(0, 200));
      errors.push(`${provider.name}: ${msg}`);
      recordFailure(provider.name, msg);
    }
  }

  throw new Error(`All AI providers failed:\n${errors.join('\n')}`);
}

/**
 * Route a JSON-mode request. Parses and returns object.
 */
export async function routeJson<T>(
  messages: AIMessage[],
  opts: RouteOptions = {}
): Promise<{ data: T; meta: RouteResult }> {
  const result = await routeChat(messages, { ...opts, json_mode: true });

  let cleaned = result.content.trim();
  /* Strip markdown fences if any */
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) cleaned = fenceMatch[1].trim();
  /* Fallback: find first {...last } */
  if (!cleaned.startsWith('{')) {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first !== -1 && last > first) {
      cleaned = cleaned.slice(first, last + 1);
    }
  }

  let parsed: T;
  try {
    parsed = JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Router: invalid JSON from ${result.provider}: ${result.content.slice(0, 200)}`);
  }

  return { data: parsed, meta: result };
}

export function getProviderStatus() {
  return {
    providers: PROVIDERS.map((p) => ({
      name: p.name,
      enabled: p.isEnabled(),
    })),
    health: getHealthReport(),
  };
}