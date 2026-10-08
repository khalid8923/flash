/* ═══════════════════════════════════════════════════════════
   AI Provider Interface
   All providers (Groq, OpenRouter, Gemini) implement this.
   ═══════════════════════════════════════════════════════════ */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIOptions {
  temperature?: number;
  max_tokens?: number;
  json_mode?: boolean;
  model?: string;
}

export interface AIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface AIResult {
  content: string;
  model: string;
  provider: string;
  usage: AIUsage;
  latency_ms: number;
}

export interface AIProvider {
  name: string;
  isEnabled(): boolean;
  chat(messages: AIMessage[], opts?: AIOptions): Promise<AIResult>;
}

export type Lang = 'en' | 'ar';