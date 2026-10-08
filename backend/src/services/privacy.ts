/* ═══════════════════════════════════════════════════════════
   FLASH - Privacy: Data Inventory + Processor Register
   (M12-01 + M12-02)
   Static definitions — safe defaults, no DB required.
   ═══════════════════════════════════════════════════════════ */

export type DataClass = 'D0' | 'D1' | 'D2' | 'D3' | 'D4';

export interface InventoryRow {
  table: string;
  class: DataClass;
  purpose: string;
  retention_days: number | null;  // null = lifetime
  processor: string | null;
}

export const DATA_INVENTORY: InventoryRow[] = [
  // D0 — Public catalog
  { table: 'domains',              class: 'D0', purpose: 'Public catalog of cognitive domains',  retention_days: null, processor: null },
  { table: 'games',                class: 'D0', purpose: 'Public catalog of games',              retention_days: null, processor: null },
  { table: 'game_domain_weights',  class: 'D0', purpose: 'Public weights for domain loading',     retention_days: null, processor: null },
  { table: 'badges',               class: 'D0', purpose: 'Public badge definitions',              retention_days: null, processor: null },
  { table: 'norms',                class: 'D0', purpose: 'Published population norms',            retention_days: null, processor: null },
  { table: 'difficulty_configs',   class: 'D0', purpose: 'Public difficulty levels',              retention_days: null, processor: null },
  // D1 — Operational
  { table: 'job_runs',             class: 'D1', purpose: 'Operational job history',               retention_days: 90,   processor: null },
  { table: 'feature_flags',        class: 'D1', purpose: 'Runtime configuration',                 retention_days: null, processor: null },
  { table: 'integrity_events',     class: 'D1', purpose: 'Anti-cheat signals',                    retention_days: 365,  processor: null },
  { table: 'ai_provider_usage',    class: 'D1', purpose: 'AI cost + latency ledger',              retention_days: 90,   processor: null },
  { table: 'metric_daily',         class: 'D1', purpose: 'Aggregated analytics rollups',          retention_days: null, processor: null },
  { table: 'admin_audit_log',      class: 'D1', purpose: 'Admin action audit trail',              retention_days: 365,  processor: null },
  // D2 — Pseudonymous behavior
  { table: 'sessions',             class: 'D2', purpose: 'Per-session cognitive metrics',         retention_days: null, processor: null },
  { table: 'session_trials',       class: 'D2', purpose: 'Raw trial events',                      retention_days: 180,  processor: null },
  { table: 'personal_bests',       class: 'D2', purpose: 'User personal records',                 retention_days: null, processor: null },
  { table: 'user_game_stats',      class: 'D2', purpose: 'Per-game aggregate stats',              retention_days: null, processor: null },
  { table: 'domain_scores',        class: 'D2', purpose: 'Per-domain composite score',            retention_days: null, processor: null },
  { table: 'user_badges',          class: 'D2', purpose: 'Unlocked badges',                       retention_days: null, processor: null },
  { table: 'player_game_ability',  class: 'D2', purpose: 'Adaptive engine state',                 retention_days: null, processor: null },
  { table: 'engine_decisions',     class: 'D2', purpose: 'Adaptive decision log',                 retention_days: 365,  processor: null },
  { table: 'predictions',          class: 'D2', purpose: 'Predictive coach forecasts',            retention_days: 90,   processor: null },
  { table: 'error_patterns',       class: 'D2', purpose: 'Detected error patterns',               retention_days: 180,  processor: null },
  { table: 'transfer_signals',     class: 'D2', purpose: 'Cross-domain correlations',             retention_days: 365,  processor: null },
  { table: 'session_reviews',      class: 'D2', purpose: 'Admin review annotations',              retention_days: null, processor: null },
  // D3 — Personal
  { table: 'users',                class: 'D3', purpose: 'Account identity',                      retention_days: null, processor: null },
  { table: 'auth_identities',      class: 'D3', purpose: 'Provider-to-player mapping',            retention_days: null, processor: null },
  { table: 'auth_sessions',        class: 'D3', purpose: 'Opaque session tokens',                 retention_days: 90,   processor: null },
  { table: 'auth_otp_codes',       class: 'D3', purpose: 'Short-lived login codes',               retention_days: 1,    processor: null },
  { table: 'devices',              class: 'D3', purpose: 'Device list per player',                retention_days: null, processor: null },
  { table: 'user_settings',        class: 'D3', purpose: 'User preferences',                      retention_days: null, processor: null },
  // D4 — Sensitive content
  { table: 'ai_messages',          class: 'D4', purpose: 'AI chat message bodies',                retention_days: 90,   processor: 'groq' },
  { table: 'ai_conversations',     class: 'D4', purpose: 'AI chat thread metadata',               retention_days: 90,   processor: 'groq' },
  { table: 'journal_entries',      class: 'D4', purpose: 'User mood + energy logs',               retention_days: 90,   processor: 'groq' },
  { table: 'voice_requests',       class: 'D4', purpose: 'Voice transcription logs',              retention_days: 30,   processor: 'groq' },
];

export interface ProcessorRow {
  name: string;
  purpose: string;
  data_classes: DataClass[];
  region: string;
  retention_note: string;
  zdr: boolean;
  verified_at: string;
}

export const PROCESSOR_REGISTER: ProcessorRow[] = [
  {
    name: 'Neon',
    purpose: 'PostgreSQL database hosting',
    data_classes: ['D0', 'D1', 'D2', 'D3', 'D4'],
    region: 'EU (Frankfurt) — target',
    retention_note: 'Persistent until user erasure; backups roll off in 35 days',
    zdr: true,
    verified_at: '2026-10-09',
  },
  {
    name: 'Groq',
    purpose: 'Primary LLM inference (EN + AR + Whisper)',
    data_classes: ['D1', 'D4'],
    region: 'US global fleet (no pinning on free)',
    retention_note: 'Zero Data Retention enabled — no training use',
    zdr: true,
    verified_at: '2026-10-09',
  },
  {
    name: 'OpenRouter',
    purpose: 'Fallback LLM inference',
    data_classes: ['D1'],
    region: 'US global',
    retention_note: 'Used only for non-sensitive content',
    zdr: false,
    verified_at: '2026-10-09',
  },
  {
    name: 'Google Gemini',
    purpose: 'Secondary fallback (kept for future)',
    data_classes: ['D1'],
    region: 'US global',
    retention_note: 'Free tier may use content for product improvement — no D4 allowed',
    zdr: false,
    verified_at: '2026-10-09',
  },
  {
    name: 'Resend',
    purpose: 'Transactional email (OTP, security)',
    data_classes: ['D3'],
    region: 'US',
    retention_note: 'Message content not stored beyond delivery',
    zdr: true,
    verified_at: '2026-10-09',
  },
];

export function inventoryByClass(): Record<DataClass, number> {
  const counts: Record<DataClass, number> = { D0: 0, D1: 0, D2: 0, D3: 0, D4: 0 };
  for (const row of DATA_INVENTORY) counts[row.class]++;
  return counts;
}