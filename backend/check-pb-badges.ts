import { pool } from './src/config/db.js';

const sessions = await pool.query(`SELECT COUNT(*) FROM sessions`);
const pbs = await pool.query(`
  SELECT game_id, variant, metric, value
  FROM personal_bests
  ORDER BY achieved_at DESC
`);
const badges = await pool.query(`
  SELECT ub.badge_id, b.name
  FROM user_badges ub JOIN badges b ON b.id = ub.badge_id
  WHERE ub.revoked_at IS NULL
  ORDER BY ub.unlocked_at
`);

console.log('\n📊 Database state:\n');
console.log(`  Sessions: ${sessions.rows[0].count}\n`);
console.log('🏆 Personal Bests:');
pbs.rows.forEach((r) => console.log(`  ${r.game_id.padEnd(12)} ${r.metric.padEnd(15)} = ${r.value} (${r.variant})`));
console.log('\n🎖️  Badges Unlocked:');
badges.rows.forEach((r) => console.log(`  ${r.badge_id.padEnd(20)} ${r.name}`));
console.log('');

await pool.end();