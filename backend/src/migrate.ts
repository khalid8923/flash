import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, closePool } from './config/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, 'migrations');

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function appliedSet(): Promise<Set<string>> {
  const res = await pool.query('SELECT filename FROM _migrations');
  return new Set(res.rows.map((r) => r.filename));
}

async function run() {
  console.log('🔧 Running migrations...\n');
  await ensureMigrationsTable();
  const applied = await appliedSet();

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`⏭️  ${file} (already applied)`);
      continue;
    }
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8').replace(/^\uFEFF/, '');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`✅ ${file}`);
      count++;
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error(`❌ ${file} FAILED:`, err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  console.log(`\n✨ Done. Applied ${count} migration(s).`);
  await closePool();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
