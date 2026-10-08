import { pool } from "./src/config/db.js";

try {
  console.log("T1: SELECT 1");
  const t1 = Date.now();
  await pool.query("SELECT 1");
  console.log("  OK (" + (Date.now() - t1) + "ms)");

  console.log("T2: _migrations count");
  const m = await pool.query("SELECT COUNT(*)::int AS n FROM _migrations");
  console.log("  OK, n=" + m.rows[0].n);

  console.log("T3: games count (with deleted_at)");
  const g = await pool.query("SELECT COUNT(*)::int AS n FROM games WHERE deleted_at IS NULL");
  console.log("  OK, n=" + g.rows[0].n);

  console.log("T4: games.deleted_at exists?");
  const c = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='games' AND column_name IN ('deleted_at','deleted_reason')");
  console.log("  Found: " + c.rows.map(r => r.column_name).join(", "));

  console.log("\n>>> ALL PASS");
} catch (err) {
  console.error("\n>>> FAILED at: " + (err as Error).message);
  console.error((err as Error).stack);
}
process.exit(0);