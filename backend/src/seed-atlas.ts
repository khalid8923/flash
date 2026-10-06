import { pool, closePool } from './config/db.js';
import { ATLAS } from './services/difficulty/atlas.js';

async function seedAtlas() {
  console.log('\n🧭 Seeding Difficulty Atlas...\n');
  let count = 0;

  for (const game of ATLAS) {
    for (const lvl of game.levels) {
      const res = await pool.query(
        `INSERT INTO difficulty_configs
         (game_id, mode, level, label, levers, calibrated_difficulty, domain_loadings)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (game_id, mode, level) DO NOTHING`,
        [game.game_id, game.mode, lvl.level, lvl.label,
         JSON.stringify(lvl.levers), lvl.calibrated_difficulty,
         JSON.stringify(lvl.domain_loadings)]
      );
      if (res.rowCount) count++;
    }
    console.log(`  ✅ ${game.game_id.padEnd(12)} ${game.levels.length} levels`);
  }

  const total = await pool.query('SELECT COUNT(*) FROM difficulty_configs');
  console.log(`\n✨ Done. Inserted ${count} rows. Total in DB: ${total.rows[0].count}\n`);
  await closePool();
}

seedAtlas().catch((err) => { console.error(err); process.exit(1); });