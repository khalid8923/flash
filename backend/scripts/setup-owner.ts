/* Setup first owner (with Neon cold-start retry) */
import { pool, closePool } from '../src/config/db.js';
import { createAdmin } from '../src/services/admin-auth.js';

const email = process.argv[2];
const displayName = process.argv[3] ?? 'Owner';

if (!email || !email.includes('@')) {
  console.error('[ERROR] Usage: npm run admin:setup -- <email> "<display name>"');
  process.exit(1);
}

/* Warm-up: retry the first query up to 3 times */
async function warmup(): Promise<void> {
  for (let i = 1; i <= 3; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('[WARMUP] DB ready (attempt ' + i + ')');
      return;
    } catch (err) {
      console.log('[WARMUP] attempt ' + i + ' failed: ' + (err as Error).message);
      if (i === 3) throw err;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

await warmup();

const existing = await pool.query<{ n: number }>(
  `SELECT COUNT(*)::int AS n FROM admin_users WHERE role = 'owner' AND status = 'active'`
);
if ((existing.rows[0]?.n ?? 0) > 0) {
  console.error('[ERROR] An active owner already exists.');
  await closePool();
  process.exit(2);
}

const { admin, token } = await createAdmin({
  email, displayName, role: 'owner', createdBy: null,
});

console.log('');
console.log('======= OWNER CREATED =======');
console.log('  ID:    ' + admin.id);
console.log('  Email: ' + admin.email);
console.log('  Role:  ' + admin.role);
console.log('');
console.log('  TOKEN (save now):');
console.log('  ' + token);
console.log('=============================');
console.log('');

await closePool();
process.exit(0);