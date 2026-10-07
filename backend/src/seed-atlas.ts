import { pool, closePool } from './config/db.js';
import { ATLAS } from './services/difficulty/atlas.js';

async function seedAtlas() {
  console.log('\n🧭 Seeding Difficulty Atlas...\n');
  let total = 0;

  for (const game of ATLAS) {
    let inserted = 0;
    for (const lvl of game.levels) {
      const res = await pool.query(
        `INSERT INTO difficulty_configs
         (game_id, mode, level, label, levers, calibrated_difficulty, domain_loadings)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (game_id, mode, level) DO UPDATE
         SET label = EXCLUDED.label,
             levers = EXCLUDED.levers,
             calibrated_difficulty = EXCLUDED.calibrated_difficulty,
             domain_loadings = EXCLUDED.domain_loadings,
             updated_at = now()`,
        [game.game_id, game.mode, lvl.level, lvl.label,
         JSON.stringify(lvl.levers), lvl.calibrated_difficulty,
         JSON.stringify(lvl.domain_loadings)]
      );
      inserted++;
    }
    console.log(`  ✅ ${game.game_id.padEnd(20)} ${inserted} levels`);
    total += inserted;
  }

  const dbTotal = await pool.query('SELECT COUNT(*) FROM difficulty_configs');
  console.log(`\n✨ Done. Upserted ${total} rows. Total in DB: ${dbTotal.rows[0].count}\n`);
  await closePool();
}

seedAtlas().catch((err) => { console.error(err); process.exit(1); });