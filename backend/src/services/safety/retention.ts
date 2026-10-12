/* ═══════════════════════════════════════════════════════════
   FLASH - Retention Jobs (R19)
   Purges data older than the configured retention window.
   Idempotent. Safe to run on a schedule.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../../config/db.js';

export interface RetentionRule {
  table: string;
  date_column: string;
  days: number;
  description: string;
  preserve_where?: string;
}

/* Rules derived from privacy.ts DATA_INVENTORY */
export const RETENTION_RULES: RetentionRule[] = [
  { table: 'auth_otp_codes',      date_column: 'created_at', days: 1,   description: 'OTP codes expire after 1 day' },
  { table: 'auth_sessions',       date_column: 'created_at', days: 90,  description: 'Old sessions after 90 days' },
  { table: 'ai_provider_usage',   date_column: 'created_at', days: 90,  description: 'AI ledger 90 days' },
  { table: 'ai_messages',         date_column: 'created_at', days: 90,  description: 'AI chat 90 days' },
  { table: 'journal_entries',     date_column: 'created_at', days: 90,  description: 'Journal 90 days' },
  { table: 'voice_requests',      date_column: 'created_at', days: 30,  description: 'Voice logs 30 days' },
  { table: 'job_runs',            date_column: 'created_at', days: 90,  description: 'Job history 90 days',
    preserve_where: "status IN ('pending','running')" },
];

export interface RetentionPreview {
  table: string;
  description: string;
  would_delete: number;
  days: number;
}

export interface RetentionResult {
  table: string;
  deleted: number;
  days: number;
}

/** Count rows that would be deleted (preview). */
export async function previewRetention(): Promise<RetentionPreview[]> {
  const out: RetentionPreview[] = [];
  for (const rule of RETENTION_RULES) {
    const preserve = rule.preserve_where ? ` AND NOT (${rule.preserve_where})` : '';
    const r = await pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM ${rule.table}
        WHERE ${rule.date_column} < NOW() - ($1 || ' days')::interval${preserve}`,
      [String(rule.days)]
    );
    out.push({
      table: rule.table,
      description: rule.description,
      would_delete: r.rows[0]?.n ?? 0,
      days: rule.days,
    });
  }
  return out;
}

/** Execute the purges. */
export async function runRetention(): Promise<RetentionResult[]> {
  const out: RetentionResult[] = [];
  for (const rule of RETENTION_RULES) {
    const preserve = rule.preserve_where ? ` AND NOT (${rule.preserve_where})` : '';
    try {
      const r = await pool.query(
        `DELETE FROM ${rule.table}
          WHERE ${rule.date_column} < NOW() - ($1 || ' days')::interval${preserve}`,
        [String(rule.days)]
      );
      out.push({ table: rule.table, deleted: r.rowCount ?? 0, days: rule.days });
    } catch {
      out.push({ table: rule.table, deleted: 0, days: rule.days });
    }
  }
  return out;
}