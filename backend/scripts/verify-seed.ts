import { pool } from '../src/config/db.js';

const [domains, games, badges] = await Promise.all([
  pool.query('SELECT COUNT(*) FROM domains'),
  pool.query('SELECT COUNT(*) FROM games'),
  pool.query('SELECT COUNT(*) FROM badges'),
]);

console.log('\n📊 Seed verification:\n');
console.log(`  Domains: ${domains.rows[0].count}`);
console.log(`  Games:   ${games.rows[0].count}`);
console.log(`  Badges:  ${badges.rows[0].count}`);

const byDomain = await pool.query(`
  SELECT d.id, d.name, COUNT(g.id) AS games
  FROM domains d
  LEFT JOIN games g ON g.domain_id = d.id
  GROUP BY d.id, d.name
  ORDER BY d.id
`);
console.log('\n📁 Games per domain:\n');
byDomain.rows.forEach((r) => console.log(`  ${String(r.id).padEnd(12)} ${r.games} games`));

await pool.end();