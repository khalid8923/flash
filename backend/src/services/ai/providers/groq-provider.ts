/* ═══════════════════════════════════════════════════════════
   Groq Provider — wraps existing GroqClient
   ═══════════════════════════════════════════════════════════ */

import { groq as groqClient } from '../groq-client.js';
import type { AIProvider, AIMessage, AIOptions, AIResult } from './types.js';

export class GroqProvider implements AIProvider {
  name = 'groq';

  isEnabled(): boolean {
    return groqClient.isEnabled();
  }

  async chat(messages: AIMessage[], opts: AIOptions = {}): Promise<AIResult> {
    const res = await groqClient.chat(messages, {
      temperature: opts.temperature,
      max_tokens: opts.max_tokens,
      json_mode: opts.json_mode,
      model: opts.model,
    });
    return {
      content: res.content,
      model: res.model,
      provider: this.name,
      usage: res.usage,
      latency_ms: res.latency_ms,
    };
  }
}

export const groqProvider = new GroqProvider();