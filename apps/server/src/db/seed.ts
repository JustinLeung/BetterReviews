import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pool } from './pool';
import { logger } from '../lib/logger';

/**
 * Seed runner. Applies every `*.sql` file in apps/server/seeds in filename
 * order. Seed files are written to be idempotent (ON CONFLICT DO NOTHING), so
 * this is safe to run repeatedly — including on container startup.
 */
const SEEDS_DIR = path.resolve(__dirname, '../../seeds');

export async function runSeeds(): Promise<void> {
  const files = readdirSync(SEEDS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = readFileSync(path.join(SEEDS_DIR, file), 'utf8');
    logger.info(`Seeding: ${file}`);
    await pool.query(sql);
  }
  logger.info(`Applied ${files.length} seed file(s).`);
}

if (require.main === module) {
  runSeeds()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('Seeding failed', err);
      void pool.end().finally(() => process.exit(1));
    });
}
