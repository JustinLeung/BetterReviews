import express, { type Express } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { attachUser } from './middleware/auth';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/error';
import { apiRouter } from './routes';

/** Builds the configured Express application (no network side effects). */
export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigins.length > 0 ? env.corsOrigins : true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  // Resolves req.userId (mock auth locally; Supabase JWT later).
  app.use(attachUser);

  app.use('/', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
