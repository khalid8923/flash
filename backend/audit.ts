import { pool } from './src/config/db.js';

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  DB AUDIT — Phase 1: Indexes');
console.log('═══════════════════════════════════════════════════════════\n');

const idx = await pool.query(`
  SELECT
    t.tablename,
    i.indexname,
    i.indexdef,
    COALESCE(s.idx_scan, 0)::int AS scans,
    pg_size_pretty(pg_relation_size(i.indexname::regclass)) AS size
  FROM pg_indexes i
  JOIN pg_tables t ON t.tablename = i.tablename AND t.schemaname = i.schemaname
  LEFT JOIN pg_stat_user_indexes s ON s.indexrelname = i.indexname
  WHERE i.schemaname = 'public'
    AND i.indexname NOT LIKE '%_pkey'
  ORDER BY t.tablename, i.indexname
`);
console.table(idx.rows);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  DB AUDIT — Phase 2: Foreign Keys');
console.log('═══════════════════════════════════════════════════════════\n');

const fks = await pool.query(`
  SELECT
    tc.table_name AS from_table,
    kcu.column_name AS from_column,
    ccu.table_name AS to_table,
    ccu.column_name AS to_column,
    rc.delete_rule AS on_delete
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
  JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
  ORDER BY tc.table_name, kcu.column_name
`);
console.table(fks.rows);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  DB AUDIT — Phase 3: Tables WITHOUT created_at');
console.log('═══════════════════════════════════════════════════════════\n');

const noTimestamps = await pool.query(`
  SELECT t.tablename
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_name = t.tablename
        AND c.column_name IN ('created_at', 'generated_at', 'computed_at', 'started_at', 'issued_at', 'first_seen_at')
    )
  ORDER BY t.tablename
`);
console.log('Tables without any timestamp column:');
console.table(noTimestamps.rows);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  DB AUDIT — Phase 4: Candidate Missing Indexes');
console.log('═══════════════════════════════════════════════════════════\n');

const missingIdx = await pool.query(`
  SELECT
    'sessions(user_id, ended_at)' AS suggested_index,
    'frequent in all AI features' AS reason
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename='sessions' AND indexdef LIKE '%(user_id, ended_at%'
  )
  UNION ALL
  SELECT 'sessions(user_id, game_id, ended_at)',
    'predictions + fingerprint + engine'
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename='sessions' AND indexdef LIKE '%(user_id, game_id, ended_at%'
  )
  UNION ALL
  SELECT 'ai_messages(conversation_id, created_at)',
    'coach chat load'
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename='ai_messages' AND indexdef LIKE '%(conversation_id, created_at%'
  )
  UNION ALL
  SELECT 'ai_conversations(user_id, updated_at)',
    'chat list sort'
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename='ai_conversations' AND indexdef LIKE '%(user_id, updated_at%'
  )
  UNION ALL
  SELECT 'engine_decisions(user_id, created_at)',
    'decisions feed'
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename='engine_decisions' AND indexdef LIKE '%(user_id, created_at%'
  )
  UNION ALL
  SELECT 'journal_entries(user_id, entry_date)',
    'journal history'
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename='journal_entries' AND indexdef LIKE '%(user_id, entry_date%'
  )
  UNION ALL
  SELECT 'lab_experiments(user_id, status)',
    'active experiment lookup'
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename='lab_experiments' AND indexdef LIKE '%(user_id, status%'
  )
  UNION ALL
  SELECT 'game_variants(parent_game_id, language)',
    'variants list'
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename='game_variants' AND indexdef LIKE '%(parent_game_id, language%'
  )
`);
console.log('Suggested indexes that are MISSING:');
console.table(missingIdx.rows);
if (missingIdx.rows.length === 0) console.log('  ✅ None missing');

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  DB AUDIT — Phase 5: Tables WITHOUT Primary Key');
console.log('═══════════════════════════════════════════════════════════\n');

const noPK = await pool.query(`
  SELECT t.tablename
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      WHERE c.conrelid = (t.schemaname || '.' || t.tablename)::regclass
        AND c.contype = 'p'
    )
  ORDER BY t.tablename
`);
if (noPK.rows.length === 0) console.log('  ✅ All tables have PK');
else console.table(noPK.rows);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  DB AUDIT — Phase 6: Row counts (live)');
console.log('═══════════════════════════════════════════════════════════\n');

const counts = await pool.query(`
  SELECT
    'sessions' AS table_name, COUNT(*)::int AS rows FROM sessions
  UNION ALL SELECT 'session_trials', COUNT(*)::int FROM session_trials
  UNION ALL SELECT 'predictions', COUNT(*)::int FROM predictions
  UNION ALL SELECT 'ai_messages', COUNT(*)::int FROM ai_messages
  UNION ALL SELECT 'ai_conversations', COUNT(*)::int FROM ai_conversations
  UNION ALL SELECT 'cognitive_fingerprints', COUNT(*)::int FROM cognitive_fingerprints
  UNION ALL SELECT 'generated_content_cache', COUNT(*)::int FROM generated_content_cache
  UNION ALL SELECT 'nudge_cache', COUNT(*)::int FROM nudge_cache
  UNION ALL SELECT 'micro_lessons', COUNT(*)::int FROM micro_lessons
  UNION ALL SELECT 'journal_entries', COUNT(*)::int FROM journal_entries
  UNION ALL SELECT 'lab_experiments', COUNT(*)::int FROM lab_experiments
  UNION ALL SELECT 'game_variants', COUNT(*)::int FROM game_variants
  UNION ALL SELECT 'transfer_signals', COUNT(*)::int FROM transfer_signals
  UNION ALL SELECT 'error_patterns', COUNT(*)::int FROM error_patterns
  UNION ALL SELECT 'engine_decisions', COUNT(*)::int FROM engine_decisions
`);
console.table(counts.rows);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  ✅ AUDIT COMPLETE');
console.log('═══════════════════════════════════════════════════════════\n');

process.exit(0);