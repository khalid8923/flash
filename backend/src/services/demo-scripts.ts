/* ═══════════════════════════════════════════════════════════
   FLASH - Demo Scripted Accounts (M11-03)
   5 pre-configured demo users at known states.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../config/db.js';

export interface DemoScript {
  key: string;
  label: string;
  description: string;
  email: string;
  display_name: string;
}

export const DEMO_SCRIPTS: DemoScript[] = [
  {
    key: 'new',
    label: 'New user',
    description: 'Fresh account, 0 sessions',
    email: 'script_new@demo.local',
    display_name: 'New User',
  },
  {
    key: 'calibrating',
    label: 'Calibrating',
    description: '2 sessions, still building baseline',
    email: 'script_calibrating@demo.local',
    display_name: 'Calibrating User',
  },
  {
    key: 'established',
    label: 'Established',
    description: '15+ sessions, stable performance',
    email: 'script_established@demo.local',
    display_name: 'Established User',
  },
  {
    key: 'plateau',
    label: 'Plateaued',
    description: 'Flat performance across recent sessions',
    email: 'script_plateau@demo.local',
    display_name: 'Plateau User',
  },
  {
    key: 'returning',
    label: 'Returning',
    description: 'Came back after a 2-week break',
    email: 'script_returning@demo.local',
    display_name: 'Returning User',
  },
];

export async function ensureScripts(): Promise<Array<DemoScript & { user_id: string; created: boolean }>> {
  const out: Array<DemoScript & { user_id: string; created: boolean }> = [];

  for (const s of DEMO_SCRIPTS) {
    const existing = await pool.query<{ id: string }>(
      `SELECT id FROM users WHERE email = $1`,
      [s.email]
    );
    if (existing.rows[0]) {
      out.push({ ...s, user_id: existing.rows[0].id, created: false });
      continue;
    }
    const ins = await pool.query<{ id: string }>(
      `INSERT INTO users (email, display_name, origin, status)
       VALUES ($1, $2, 'demo', 'active') RETURNING id`,
      [s.email, s.display_name]
    );
    out.push({ ...s, user_id: ins.rows[0]!.id, created: true });
  }

  return out;
}

export async function resetScripts(): Promise<number> {
  const emails = DEMO_SCRIPTS.map((s) => s.email);
  const r = await pool.query(
    `DELETE FROM users WHERE email = ANY($1::text[]) RETURNING id`,
    [emails]
  );
  return r.rowCount ?? 0;
}

export async function listScripts(): Promise<Array<DemoScript & { exists: boolean; user_id: string | null }>> {
  const emails = DEMO_SCRIPTS.map((s) => s.email);
  const r = await pool.query<{ id: string; email: string }>(
    `SELECT id, email FROM users WHERE email = ANY($1::text[])`,
    [emails]
  );
  const map = new Map(r.rows.map((row) => [row.email, row.id]));
  return DEMO_SCRIPTS.map((s) => ({
    ...s,
    user_id: map.get(s.email) ?? null,
    exists: map.has(s.email),
  }));
}