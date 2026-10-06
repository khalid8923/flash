import { pool } from './src/config/db.js';

const q = `
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name
`;

const res = await pool.query(q);
console.log('\n📋 Tables in flashdb:\n');
res.rows.forEach((r, i) => console.log(`  ${i + 1}. ${r.table_name}`));
console.log(`\n✅ Total: ${res.rowCount} tables\n`);
await pool.end();
