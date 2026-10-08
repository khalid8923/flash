/* ═══════════════════════════════════════════════════════════
   Catalog Sync
   Source of truth: src/catalog/games/*.ts
   Writes to: games, game_domain_weights, difficulty_configs
   Soft-deletes games no longer in catalog.
   ═══════════════════════════════════════════════════════════ */

import { pool } from '../config/db.js';
import { ALL_GAMES } from '../catalog/registry.js';
import type { GameConfig } from '../catalog/types.js';

export interface SyncResult {
  games_upserted: number;
  games_soft_deleted: number;
  weights_replaced: number;
  levels_upserted: number;
  errors: Array<{ game_id: string; error: string }>;
  duration_ms: number;
}

export async function syncCatalog(): Promise<SyncResult> {
  const started = Date.now();
  const result: SyncResult = {
    games_upserted: 0,
    games_soft_deleted: 0,
    weights_replaced: 0,
    levels_upserted: 0,
    errors: [],
    duration_ms: 0,
  };

  const configIds = new Set(ALL_GAMES.map((g) => g.id));

  /* 1. Upsert every config game */
  for (const cfg of ALL_GAMES) {
    try {
      await syncOneGame(cfg);
      result.games_upserted++;
      result.weights_replaced += Object.keys(cfg.domain_weights).length;
      result.levels_upserted += cfg.levels.length;
    } catch (err) {
      result.errors.push({ game_id: cfg.id, error: (err as Error).message });
    }
  }

  /* 2. Soft-delete games in DB that no longer exist in configs */
  const dbGames = await pool.query<{ id: string }>(
    `SELECT id FROM games WHERE deleted_at IS NULL`
  );
  for (const row of dbGames.rows) {
    if (!configIds.has(row.id)) {
      await pool.query(
        `UPDATE games
            SET deleted_at = NOW(),
                deleted_reason = 'removed_from_catalog',
                status = 'disabled'
          WHERE id = $1`,
        [row.id]
      );
      result.games_soft_deleted++;
    }
  }

  result.duration_ms = Date.now() - started;
  return result;
}

/* ═══════════════════════════════════════════════════════════ */
async function syncOneGame(cfg: GameConfig): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    /* Upsert main game row */
    await client.query(
      `INSERT INTO games (
         id, name, domain_id, trial_pattern, primary_metric, metric_direction,
         rt_floor_ms, rt_ceiling_ms, max_trials_per_session, min_duration_ms,
         max_duration_ms, max_score, trial_exclusion_rules, game_version,
         scoring_version, status
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         domain_id = EXCLUDED.domain_id,
         trial_pattern = EXCLUDED.trial_pattern,
         primary_metric = EXCLUDED.primary_metric,
         metric_direction = EXCLUDED.metric_direction,
         rt_floor_ms = EXCLUDED.rt_floor_ms,
         rt_ceiling_ms = EXCLUDED.rt_ceiling_ms,
         max_trials_per_session = EXCLUDED.max_trials_per_session,
         min_duration_ms = EXCLUDED.min_duration_ms,
         max_duration_ms = EXCLUDED.max_duration_ms,
         max_score = EXCLUDED.max_score,
         trial_exclusion_rules = EXCLUDED.trial_exclusion_rules,
         game_version = EXCLUDED.game_version,
         scoring_version = EXCLUDED.scoring_version,
         status = EXCLUDED.status,
         deleted_at = NULL,
         deleted_reason = NULL`,
      [
        cfg.id,
        cfg.name.en,
        cfg.domain,
        cfg.trial_pattern,
        cfg.primary_metric,
        cfg.metric_direction,
        cfg.rt_floor_ms,
        cfg.rt_ceiling_ms,
        cfg.max_trials_per_session,
        cfg.min_duration_ms,
        cfg.max_duration_ms,
        cfg.max_score,
        JSON.stringify(cfg.trial_exclusion_rules),
        cfg.game_version,
        cfg.scoring_version,
        cfg.status,
      ]
    );

    /* Replace domain weights */
    await client.query(`DELETE FROM game_domain_weights WHERE game_id = $1`, [cfg.id]);
    for (const [domainId, weight] of Object.entries(cfg.domain_weights)) {
      if (typeof weight !== 'number') continue;
      await client.query(
        `INSERT INTO game_domain_weights (game_id, domain_id, weight)
         VALUES ($1, $2, $3)`,
        [cfg.id, domainId, weight]
      );
    }

    /* Upsert 15 difficulty levels */
    for (const lvl of cfg.levels) {
      await client.query(
        `INSERT INTO difficulty_configs
           (game_id, mode, level, label, levers, calibrated_difficulty, domain_loadings)
         VALUES ($1, 'classic', $2, $3, $4, $5, $6)
         ON CONFLICT (game_id, mode, level) DO UPDATE SET
           label = EXCLUDED.label,
           levers = EXCLUDED.levers,
           calibrated_difficulty = EXCLUDED.calibrated_difficulty,
           domain_loadings = EXCLUDED.domain_loadings`,
        [
          cfg.id,
          lvl.level,
          lvl.label,
          JSON.stringify(lvl.levers),
          lvl.calibrated_difficulty,
          JSON.stringify(cfg.domain_weights),
        ]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/* ═══════════════════════════════════════════════════════════
   Drift check: report games in DB but not in configs (or vice versa)
   ═══════════════════════════════════════════════════════════ */
export interface DriftReport {
  in_configs_not_in_db: string[];
  in_db_not_in_configs: string[];
  counts_match: boolean;
}

export async function checkCatalogDrift(): Promise<DriftReport> {
  const configIds = new Set(ALL_GAMES.map((g) => g.id));
  const dbRes = await pool.query<{ id: string }>(
    `SELECT id FROM games WHERE deleted_at IS NULL`
  );
  const dbIds = new Set(dbRes.rows.map((r) => r.id));

  const inConfigsNotDb: string[] = [];
  for (const id of configIds) if (!dbIds.has(id)) inConfigsNotDb.push(id);

  const inDbNotConfigs: string[] = [];
  for (const id of dbIds) if (!configIds.has(id)) inDbNotConfigs.push(id);

  return {
    in_configs_not_in_db: inConfigsNotDb,
    in_db_not_in_configs: inDbNotConfigs,
    counts_match: inConfigsNotDb.length === 0 && inDbNotConfigs.length === 0,
  };
}