import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pool, withTransaction } from './pool';
import { logger } from '../lib/logger';

/**
 * Minimal forward-only SQL migration runner. Applies every `*.sql` file in
 * apps/server/migrations in filename order, recording applied files in a
 * `schema_migrations` table so re-runs are no-ops.
 *
 * Resolved from __dirname so it works both via tsx (src/db) and compiled
 * output (dist/db), regardless of the current working directory.
 */
const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name        text PRIMARY KEY,
      applied_at  timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function appliedMigrations(): Promise<Set<string>> {
  const { rows } = await pool.query<{ name: string }>(
    'SELECT name FROM schema_migrations',
  );
  return new Set(rows.map((r) => r.name));
}

export async function runMigrations(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await appliedMigrations();

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    logger.info(`Applying migration: ${file}`);
    await withTransaction(async (client) => {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [
        file,
      ]);
    });
    count += 1;
  }

  if (count === 0) {
    logger.info('No new migrations to apply.');
  } else {
    logger.info(`Applied ${count} migration(s).`);
  }
}

// Run directly (npm run migrate). The pool keeps the event loop alive, so we
// explicitly end it and exit.
if (require.main === module) {
  runMigrations()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('Migration failed', err);
      void pool.end().finally(() => process.exit(1));
    });
}
