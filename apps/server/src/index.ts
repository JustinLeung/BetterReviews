import { createApp } from './app';
import { env } from './config/env';
import { checkDatabaseConnection, pool } from './db/pool';
import { logger } from './lib/logger';

async function main(): Promise<void> {
  const app = createApp();

  // Warn (don't crash) if the DB isn't reachable yet — useful while the
  // Postgres container is still starting up.
  const dbOk = await checkDatabaseConnection();
  if (!dbOk) {
    logger.warn('Starting without a verified database connection.');
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`API server listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
    if (!env.isProduction && env.MOCK_USER_ID) {
      logger.warn(`Mock auth ENABLED — requests default to user ${env.MOCK_USER_ID}`);
    }
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down.`);
    server.close(() => {
      void pool.end().finally(() => process.exit(0));
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('Fatal startup error', err);
  process.exit(1);
});
