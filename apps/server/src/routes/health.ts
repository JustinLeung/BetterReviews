import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { checkDatabaseConnection } from '../db/pool';

export const healthRouter = Router();

/** GET /health — basic server + database health. */
healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const dbOk = await checkDatabaseConnection();
    res.status(dbOk ? 200 : 503).json({
      status: dbOk ? 'ok' : 'degraded',
      database: dbOk ? 'up' : 'down',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  }),
);
