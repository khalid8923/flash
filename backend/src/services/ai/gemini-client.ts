/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Gemini Client â€” used for Arabic (large context, good AR)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

import { env } from '../../config/env.js';

export interface GeminiMessage {
  role: 'user' | 'model';
  content: string;
}

export interface GeminiResult {
  content: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model: string;
  latency_ms: number;
}

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiClient {
  private apiKey: string;
  private defaultModel: string;
  private timeoutMs = 90_000;

  constructor() {
    this.apiKey = env.GEMINI_API_KEY ?? '';
    this.defaultModel = env.GEMINI_MODEL;
    if (!this.apiKey) {
      console.warn('[Gemini] No GEMINI_API_KEY configured â€” Arabic via Gemini disabled');
    }
  }

  isEnabled(): boolean {
    return this.apiKey.length > 0;
  }

  async chat(
    systemPrompt: string,
    messages: GeminiMessage[],
    opts: { temperature?: number; maxTokens?: number; model?: string } = {}
  ): Promise<GeminiResult> {
    if (!this.isEnabled()) throw new Error('Gemini not configured');

    const model = opts.model ?? this.defaultModel;
    const url = `${GEMINI_BASE}/${model}:generateContent?key=${this.apiKey}`;

    const body = {
      contents: messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: opts.temperature ?? 0.7,
        maxOutputTokens: opts.maxTokens ?? 600,
      },
    };

    const start = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 400)}`);
      }

      const json = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
          totalTokenCount?: number;
        };
      };

      const content =
        json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';

      return {
        content,
        usage: {
          prompt_tokens: json.usageMetadata?.promptTokenCount ?? 0,
          completion_tokens: json.usageMetadata?.candidatesTokenCount ?? 0,
          total_tokens: json.usageMetadata?.totalTokenCount ?? 0,
        },
        model,
        latency_ms: Date.now() - start,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

export const gemini = new GeminiClient();