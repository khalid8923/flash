import { syncCatalog } from '../services/catalog-sync.js';
import { pool } from '../config/db.js';

async function main() {
  console.log('\n══════════════════════════════════════');
  console.log('  Catalog Sync');
  console.log('══════════════════════════════════════\n');

  const result = await syncCatalog();

  console.log('Games upserted:     ' + result.games_upserted);
  console.log('Games soft-deleted: ' + result.games_soft_deleted);
  console.log('Weights replaced:   ' + result.weights_replaced);
  console.log('Levels upserted:    ' + result.levels_upserted);
  console.log('Errors:             ' + result.errors.length);
  console.log('Duration:           ' + result.duration_ms + 'ms');

  if (result.errors.length > 0) {
    console.error('\nErrors:');
    for (const e of result.errors) {
      console.error('  ERR ' + e.game_id + ': ' + e.error);
    }
  }

  console.log('\n══════════════════════════════════════\n');
  await pool.end();
  process.exit(result.errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});