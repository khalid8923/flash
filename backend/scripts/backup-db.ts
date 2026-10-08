/* ═══════════════════════════════════════════════════════════
   FLASH - Database Backup (R09)
   Dump all tables -> JSON -> AES-256-GCM encrypt -> backups/
   Usage: npm run backup
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../src/config/db.js';
import { writeFileSync, mkdirSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { createCipheriv, randomBytes } from 'node:crypto';
import { join } from 'node:path';

const BACKUP_KEY = process.env.BACKUP_KEY;
if (!BACKUP_KEY || BACKUP_KEY.length < 32) {
  console.error('[ERROR] BACKUP_KEY missing or too short (need 32+ chars base64)');
  process.exit(1);
}

const BACKUP_DIR = process.env.BACKUP_DIR ?? './backups';
const KEEP_LAST = parseInt(process.env.BACKUP_KEEP_LAST ?? '7', 10);

if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });

const started = Date.now();
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const filename = `flash-backup-${timestamp}.json.enc`;
const filepath = join(BACKUP_DIR, filename);

console.log('');
console.log('[BACKUP] Starting database backup...');
console.log('[BACKUP] Target: ' + filepath);
console.log('');

// ---- 1. Get list of tables ----
const tablesRes = await pool.query<{ tablename: string }>(`
  SELECT tablename FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename
`);
const tables = tablesRes.rows.map((r) => r.tablename);
console.log('[BACKUP] Tables found: ' + tables.length);

// ---- 2. Dump each table ----
const dump: Record<string, unknown[]> = {};
let totalRows = 0;
for (const t of tables) {
  try {
    const r = await pool.query(`SELECT * FROM "${t}"`);
    dump[t] = r.rows;
    totalRows += r.rowCount ?? 0;
    console.log('  ' + t.padEnd(35) + ' ' + (r.rowCount ?? 0) + ' rows');
  } catch (err) {
    console.error('  ' + t.padEnd(35) + ' ERROR: ' + (err as Error).message);
  }
}

// ---- 3. Serialize ----
const payload = {
  version: 1,
  timestamp: new Date().toISOString(),
  tableCount: tables.length,
  rowCount: totalRows,
  data: dump,
};
const json = JSON.stringify(payload);
console.log('');
console.log('[BACKUP] JSON size: ' + (json.length / 1024).toFixed(2) + ' KB');

// ---- 4. Encrypt (AES-256-GCM) ----
const key = Buffer.from(BACKUP_KEY, 'base64');
if (key.length !== 32) {
  console.error('[ERROR] BACKUP_KEY must decode to 32 bytes (got ' + key.length + ')');
  process.exit(1);
}
const iv = randomBytes(12);
const cipher = createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
const authTag = cipher.getAuthTag();

// Format: [iv(12)] [authTag(16)] [ciphertext]
const output = Buffer.concat([iv, authTag, encrypted]);
writeFileSync(filepath, output);

const sizeMB = (statSync(filepath).size / 1024 / 1024).toFixed(3);
console.log('[BACKUP] Encrypted: ' + sizeMB + ' MB');

// ---- 5. Cleanup old backups ----
const files = readdirSync(BACKUP_DIR)
  .filter((f) => f.startsWith('flash-backup-') && f.endsWith('.json.enc'))
  .sort()
  .reverse();
if (files.length > KEEP_LAST) {
  console.log('');
  console.log('[BACKUP] Cleaning up old backups (keeping last ' + KEEP_LAST + '):');
  for (const old of files.slice(KEEP_LAST)) {
    rmSync(join(BACKUP_DIR, old));
    console.log('  [DEL] ' + old);
  }
}

const elapsed = ((Date.now() - started) / 1000).toFixed(2);
console.log('');
console.log('[BACKUP] DONE in ' + elapsed + 's');
console.log('[BACKUP] File: ' + filepath);
console.log('[BACKUP] Total backups kept: ' + Math.min(files.length, KEEP_LAST));

await pool.end();
process.exit(0);