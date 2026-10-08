import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, closePool } from './config/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, 'migrations');
const ALLOW_DRIFT = process.env.MIGRATE_ALLOW_CHECKSUM_DRIFT === '1';

function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      checksum TEXT
    )
  `);
  await pool.query(`ALTER TABLE _migrations ADD COLUMN IF NOT EXISTS checksum TEXT`);
}

interface AppliedRow { filename: string; checksum: string | null; }

async function loadApplied(): Promise<Map<string, AppliedRow>> {
  const res = await pool.query<AppliedRow>('SELECT filename, checksum FROM _migrations');
  const map = new Map<string, AppliedRow>();
  for (const row of res.rows) map.set(row.filename, row);
  return map;
}

async function run() {
  console.log('[MIGRATE] Checking migrations...\n');
  await ensureMigrationsTable();
  const applied = await loadApplied();

  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();

  let appliedCount = 0;
  let baselined = 0;
  let verified = 0;

  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8').replace(/^\uFEFF/, '');
    const checksum = sha256(sql);
    const existing = applied.get(file);

    if (existing) {
      if (existing.checksum === null) {
        await pool.query('UPDATE _migrations SET checksum = $1 WHERE filename = $2', [checksum, file]);
        console.log(`[BASE] ${file} (baselined)`);
        baselined++;
      } else if (existing.checksum === checksum) {
        console.log(`[OK]   ${file}`);
        verified++;
      } else if (ALLOW_DRIFT) {
        await pool.query('UPDATE _migrations SET checksum = $1 WHERE filename = $2', [checksum, file]);
        console.log(`[DRIFT] ${file} (checksum updated)`);
        baselined++;
      } else {
        console.error('');
        console.error(`[MISMATCH] ${file}`);
        console.error(`  Stored:   ${existing.checksum}`);
        console.error(`  Computed: ${checksum}`);
        console.error('  Applied migrations must not be modified.');
        console.error('  To accept drift: $env:MIGRATE_ALLOW_CHECKSUM_DRIFT="1"; npm run migrate');
        console.error('');
        throw new Error(`Checksum mismatch: ${file}`);
      }
      continue;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (filename, checksum) VALUES ($1, $2)', [file, checksum]);
      await client.query('COMMIT');
      console.log(`[NEW]  ${file}`);
      appliedCount++;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[FAIL] ${file}: ${(err as Error).message}`);
      throw err;
    } finally {
      client.release();
    }
  }

  console.log('');
  console.log(`[MIGRATE] Done. New: ${appliedCount} | Verified: ${verified} | Baselined: ${baselined}`);
  await closePool();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});