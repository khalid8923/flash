import { pool } from './src/config/db.js';
const s = await pool.query('SELECT id, game_id, accuracy, median_rt_ms, rcs, primary_score FROM sessions ORDER BY server_received_at DESC LIMIT 5');
console.log('\n📊 Latest sessions:\n');
s.rows.forEach((r) => console.log(`  ${r.game_id.padEnd(12)} acc=${r.accuracy}%  rt=${r.median_rt_ms}ms  rcs=${r.rcs}`));
await pool.end();