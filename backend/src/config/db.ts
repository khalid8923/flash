import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

/*
 * Neon (serverless) friendly pool.
 * - max: 10 balances Neon free tier (100 CU-hours) with burst tolerance
 * - statement_timeout: kill slow queries before they burn compute
 * - idle_in_transaction_session_timeout: prevent abandoned transactions
 * - keepAlive: reuse TCP, avoid reconnecting on every request
 */
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 20_000,
  connectionTimeoutMillis: 10_000,
  keepAlive: true,
  application_name: 'flash-backend',
  statement_timeout: 15_000,
  idle_in_transaction_session_timeout: 30_000,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

export async function ping(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT 1 AS ok');
    return result.rows[0]?.ok === 1;
  } catch {
    return false;
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}