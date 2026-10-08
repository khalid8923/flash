/* ═══════════════════════════════════════════════════════════
   Gemini Provider — uses the direct REST API
   Supports both AIza... keys and AQ... OAuth tokens
   ═══════════════════════════════════════════════════════════ */

import { env } from '../../../config/env.js';
import type { AIProvider, AIMessage, AIOptions, AIResult } from './types.js';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private apiKey: string;
  private defaultModel: string;
  private timeoutMs = 30_000;

  constructor() {
    this.apiKey = env.GEMINI_API_KEY ?? '';
    this.defaultModel = env.GEMINI_MODEL || 'gemini-2.0-flash';
    if (!this.apiKey) {
      console.warn('[Gemini] No API key configured');
    }
  }

  isEnabled(): boolean {
    return this.apiKey.length > 0;
  }

  async chat(messages: AIMessage[], opts: AIOptions = {}): Promise<AIResult> {
    if (!this.isEnabled()) throw new Error('Gemini not configured');

    const model = opts.model ?? this.defaultModel;
    // Newer Google keys (AQ.Ab8...) require header auth, not query param
    const url = `${GEMINI_BASE}/${model}:generateContent`;

    /* Extract system message */
    const systemMsg = messages.find((m) => m.role === 'system');
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: opts.temperature ?? 0.7,
        maxOutputTokens: opts.max_tokens ?? 1024,
      },
    };
    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }
    if (opts.json_mode) {
      (body.generationConfig as Record<string, unknown>).responseMimeType = 'application/json';
    }

    const start = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 300)}`);
      }

      const json = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
          totalTokenCount?: number;
        };
      };

      const content = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';

      return {
        content,
        model,
        provider: this.name,
        usage: {
          prompt_tokens: json.usageMetadata?.promptTokenCount ?? 0,
          completion_tokens: json.usageMetadata?.candidatesTokenCount ?? 0,
          total_tokens: json.usageMetadata?.totalTokenCount ?? 0,
        },
        latency_ms: Date.now() - start,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

export const geminiProvider = new GeminiProvider();