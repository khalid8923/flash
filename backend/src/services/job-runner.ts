/* ═══════════════════════════════════════════════════════════
   FLASH - Job Runner (M7-01)
   DB-backed queue with FOR UPDATE SKIP LOCKED semantics.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../config/db.js';

export interface JobRun {
  id: string;
  kind: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  payload: unknown;
  result: unknown;
  error: string | null;
  attempts: number;
  max_attempts: number;
  run_after: string;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export async function enqueueJob(params: {
  kind: string;
  payload?: unknown;
  runAfterMs?: number;
  maxAttempts?: number;
}): Promise<JobRun> {
  const runAfter = new Date(Date.now() + (params.runAfterMs ?? 0));
  const r = await pool.query<JobRun>(
    `INSERT INTO job_runs (kind, payload, run_after, max_attempts)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [params.kind, params.payload ?? null, runAfter, params.maxAttempts ?? 3]
  );
  return r.rows[0]!;
}

export async function claimNextJob(): Promise<JobRun | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query<JobRun>(
      `SELECT * FROM job_runs
        WHERE status = 'pending' AND run_after <= now()
        ORDER BY run_after ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1`
    );
    const row = r.rows[0];
    if (!row) {
      await client.query('COMMIT');
      return null;
    }
    const upd = await client.query<JobRun>(
      `UPDATE job_runs
          SET status = 'running',
              started_at = now(),
              attempts = attempts + 1
        WHERE id = $1
        RETURNING *`,
      [row.id]
    );
    await client.query('COMMIT');
    return upd.rows[0]!;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function completeJob(id: string, result: unknown): Promise<void> {
  await pool.query(
    `UPDATE job_runs
        SET status = 'done', result = $2, finished_at = now(), error = NULL
      WHERE id = $1`,
    [id, result ?? null]
  );
}

export async function failJob(id: string, error: string): Promise<void> {
  /* If attempts < max_attempts: requeue with backoff. Else: mark failed. */
  const cur = await pool.query<{ attempts: number; max_attempts: number }>(
    `SELECT attempts, max_attempts FROM job_runs WHERE id = $1`,
    [id]
  );
  const row = cur.rows[0];
  if (!row) return;
  if (row.attempts < row.max_attempts) {
    const backoffMs = Math.min(60_000, 1000 * Math.pow(2, row.attempts));
    await pool.query(
      `UPDATE job_runs
          SET status = 'pending',
              error = $2,
              run_after = now() + ($3 || ' milliseconds')::interval
        WHERE id = $1`,
      [id, error, String(backoffMs)]
    );
  } else {
    await pool.query(
      `UPDATE job_runs
          SET status = 'failed', error = $2, finished_at = now()
        WHERE id = $1`,
      [id, error]
    );
  }
}

export interface JobListFilters {
  kind?: string;
  status?: string;
  limit?: number;
}

export async function listJobs(filters: JobListFilters = {}): Promise<JobRun[]> {
  const where: string[] = [];
  const args: unknown[] = [];
  let i = 1;
  if (filters.kind) { where.push(`kind = $${i++}`); args.push(filters.kind); }
  if (filters.status) { where.push(`status = $${i++}`); args.push(filters.status); }
  const lim = Math.min(500, Math.max(1, filters.limit ?? 100));
  const sql = `SELECT * FROM job_runs ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT ${lim}`;
  const r = await pool.query<JobRun>(sql, args);
  return r.rows;
}

export async function getJobStats(): Promise<{
  pending: number; running: number; done: number; failed: number;
  by_kind: Array<{ kind: string; n: number }>;
}> {
  const [counts, byKind] = await Promise.all([
    pool.query<{ status: string; n: number }>(
      `SELECT status, COUNT(*)::int AS n FROM job_runs GROUP BY status`
    ),
    pool.query<{ kind: string; n: number }>(
      `SELECT kind, COUNT(*)::int AS n FROM job_runs GROUP BY kind ORDER BY n DESC LIMIT 20`
    ),
  ]);
  const map: Record<string, number> = { pending: 0, running: 0, done: 0, failed: 0 };
  for (const row of counts.rows) map[row.status] = row.n;
  return {
    pending: map.pending ?? 0,
    running: map.running ?? 0,
    done: map.done ?? 0,
    failed: map.failed ?? 0,
    by_kind: byKind.rows,
  };
}