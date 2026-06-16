import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import { env } from '../config/env';
import { logger } from '../lib/logger';

/**
 * Shared Postgres connection pool. A single pool is created per process and
 * reused across requests.
 */
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
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
