import { pool } from "../src/config/db.js";

try {
  const t = Date.now();
  await pool.query("SELECT 1");
  const ping = Date.now() - t;

  const games = await pool.query<{ n: number }>(
    "SELECT COUNT(*)::int AS n FROM games WHERE deleted_at IS NULL"
  );
  const weights = await pool.query<{ n: number }>(
    "SELECT COUNT(*)::int AS n FROM game_domain_weights"
  );
  const levels = await pool.query<{ n: number }>(
    "SELECT COUNT(*)::int AS n FROM difficulty_configs"
  );
  const migrations = await pool.query<{ n: number }>(
    "SELECT COUNT(*)::int AS n FROM _migrations"
  );

  console.log("DB_OK");
  console.log("PING:" + ping);
  console.log("GAMES:" + (games.rows[0]?.n ?? 0));
  console.log("WEIGHTS:" + (weights.rows[0]?.n ?? 0));
  console.log("LEVELS:" + (levels.rows[0]?.n ?? 0));
  console.log("MIGRATIONS:" + (migrations.rows[0]?.n ?? 0));
  process.exit(0);
} catch (e) {
  console.log("DB_ERR:" + (e as Error).message);
  process.exit(4);
}