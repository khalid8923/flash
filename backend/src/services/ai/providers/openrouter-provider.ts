/* ═══════════════════════════════════════════════════════════
   OpenRouter Provider — free-tier models, OpenAI-compatible API
   ═══════════════════════════════════════════════════════════ */

import { env } from '../../../config/env.js';
import type { AIProvider, AIMessage, AIOptions, AIResult } from './types.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class OpenRouterProvider implements AIProvider {
  name = 'openrouter';
  private apiKey: string;
  private defaultModel: string;
  private timeoutMs = 30_000;

  constructor() {
    this.apiKey = env.OPENROUTER_API_KEY ?? '';
    this.defaultModel = env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';
    if (!this.apiKey || this.apiKey.includes('xxxxxxxx')) {
      console.warn('[OpenRouter] No valid API key configured');
    }
  }

  isEnabled(): boolean {
    return this.apiKey.length > 0 && !this.apiKey.includes('xxxxxxxx');
  }

  async chat(messages: AIMessage[], opts: AIOptions = {}): Promise<AIResult> {
    if (!this.isEnabled()) throw new Error('OpenRouter not configured');

    const body: Record<string, unknown> = {
      model: opts.model ?? this.defaultModel,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 1024,
    };
    if (opts.json_mode) {
      body.response_format = { type: 'json_object' };
    }

    const start = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://flash.app',
          'X-Title': 'FLASH Cognitive',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenRouter API ${res.status}: ${errText.slice(0, 300)}`);
      }

      const json = (await res.json()) as {
        choices: Array<{ message: { content: string } }>;
        usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
        model: string;
      };

      return {
        content: json.choices[0]?.message?.content ?? '',
        model: json.model,
        provider: this.name,
        usage: json.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        latency_ms: Date.now() - start,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

export const openrouterProvider = new OpenRouterProvider();