import { env } from '../../config/env.js';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqOptions {
  temperature?: number;
  max_tokens?: number;
  json_mode?: boolean;
  model?: string;
}

export interface GroqResult {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  latency_ms: number;
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export class GroqClient {
  private apiKey: string;
  private defaultModel: string;
  private timeoutMs = 30_000;

  constructor() {
    this.apiKey = env.GROQ_API_KEY ?? '';
    this.defaultModel = env.GROQ_MODEL_EN;
    if (!this.apiKey) {
      console.warn('[Groq] No GROQ_API_KEY configured — AI generation disabled');
    }
  }

  isEnabled(): boolean {
    return this.apiKey.length > 0;
  }

  async chat(messages: GroqMessage[], opts: GroqOptions = {}): Promise<GroqResult> {
    if (!this.isEnabled()) {
      throw new Error('Groq not configured');
    }

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
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Groq API ${res.status}: ${errText.slice(0, 300)}`);
      }

      const json = (await res.json()) as {
        choices: Array<{ message: { content: string } }>;
        usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
        model: string;
      };

      return {
        content: json.choices[0]?.message?.content ?? '',
        usage: json.usage,
        model: json.model,
        latency_ms: Date.now() - start,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async json<T>(messages: GroqMessage[], opts: GroqOptions = {}): Promise<{ data: T; meta: GroqResult }> {
    const result = await this.chat(messages, { ...opts, json_mode: true });
    let parsed: T;
    try {
      parsed = JSON.parse(result.content) as T;
    } catch {
      throw new Error(`Groq returned invalid JSON: ${result.content.slice(0, 200)}`);
    }
    return { data: parsed, meta: result };
  }
}

export const groq = new GroqClient();