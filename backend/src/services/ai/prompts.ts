/* ═══════════════════════════════════════════════════════════
   FLASH AI — Prompt Templates (merged)
   Base: 7 games | Extended: 10 games | Total: 17 games
   ═══════════════════════════════════════════════════════════ */

import { PROMPTS as BASE_PROMPTS, type PromptTemplate } from './prompts-base.js';
import { EXTENDED_PROMPTS } from './prompts-extended.js';

export type { PromptTemplate };

export const PROMPTS: Record<string, PromptTemplate> = {
  ...BASE_PROMPTS,
  ...EXTENDED_PROMPTS,
};

export function getPrompt(gameId: string, params: { difficulty: number; exclude: string[]; lang: string }): { system: string; user: string } | null {
  const tpl = PROMPTS[gameId];
  if (!tpl) return null;
  return { system: tpl.system, user: tpl.build(params) };
}

export function isGenerativeGame(gameId: string): boolean {
  return gameId in PROMPTS;
}

export function listGenerativeGames(): string[] {
  return Object.keys(PROMPTS);
}

export const TOTAL_GENERATIVE_GAMES = Object.keys(PROMPTS).length;