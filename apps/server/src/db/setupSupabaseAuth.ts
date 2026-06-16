import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pool } from './pool';
import { logger } from '../lib/logger';

/**
 * Applies the Supabase-only auth linkage (profile trigger + RLS) from
 * sql/supabase_auth.sql against the database in DATABASE_URL. Run this in the
 * local Supabase workflow AFTER migrations (the trigger references the tables).
 *
 * Requires a Supabase Postgres (it references the `auth` schema). Idempotent.
 */
const SQL_FILE = path.resolve(__dirname, '../../sql/supabase_auth.sql');

export async function setupSupabaseAuth(): Promise<void> {
  const sql = readFileSync(SQL_FILE, 'utf8');
  logger.info('Applying Supabase auth linkage (profile trigger + RLS)...');
  await pool.query(sql);
  logger.info('Supabase auth linkage applied.');
}

if (require.main === module) {
  setupSupabaseAuth()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('supabase:auth failed', err);
      void pool.end().finally(() => process.exit(1));
    });
}
