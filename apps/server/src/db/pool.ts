import { Pool, type PoolClient, type QueryResult, type QueryResultRow, types } from 'pg';
import { env } from '../config/env';
import { logger } from '../lib/logger';

// Return DATE columns (OID 1082) as the raw 'YYYY-MM-DD' string instead of a JS
// Date. The default parser builds a Date at local midnight, which serializes to
// the previous day in UTC — an off-by-one for date-only fields like
// posts.visited_at. timestamptz (OID 1184) is unaffected.
types.setTypeParser(1082, (value) => value);

/**
 * Shared Postgres connection pool. A single pool is created per process and
 * reused across requests.
 */
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Put `extensions` on the search_path so PostGIS functions (ST_*) resolve in
  // every query. On Supabase PostGIS lives in `extensions`; on plain Docker /
  // Render it's in `public`, where the missing `extensions` entry is simply
  // ignored. Applied at connection startup — no per-query round-trip.
  options: '-c search_path=public,extensions',
  // Supabase (and most managed Postgres) require SSL. Local Docker does not.
  // TODO: tighten this once a real CA is wired up for production.
  ssl: /supabase\.|sslmode=require/.test(env.DATABASE_URL)
    ? { rejectUnauthorized: false }
    : undefined,
});

pool.on('error', (err) => {
  logger.error('Unexpected Postgres pool error', err);
});

/** Run a parameterized query against the pool. */
export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params as never[]);
}

/**
 * Run a function inside a transaction, committing on success and rolling back
 * on any thrown error.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Verify connectivity (used by /health and on startup). */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    logger.error('Database connectivity check failed', err);
    return false;
  }
}
