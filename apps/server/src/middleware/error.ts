import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../lib/errors';
import { logger } from '../lib/logger';
import { env } from '../config/env';

/** 404 handler for unmatched routes. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.path}`));
}

/**
 * Centralized error middleware. Translates ApiError (and known Postgres
 * errors) into clean JSON responses; everything else becomes a 500.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // `next` is required for Express to treat this as an error handler.
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { message: err.message, details: err.details ?? undefined },
    });
    return;
  }

  // Map a couple of common Postgres errors to friendly statuses.
  const pgCode = (err as { code?: string })?.code;
  if (pgCode === '23505') {
    res.status(409).json({ error: { message: 'Resource already exists.' } });
    return;
  }
  if (pgCode === '23503') {
    res
      .status(400)
      .json({ error: { message: 'Referenced resource does not exist.' } });
    return;
  }
  if (pgCode === '22P02') {
    res.status(400).json({ error: { message: 'Invalid id format.' } });
    return;
  }

  logger.error('Unhandled error', err);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      // Only leak the underlying message in development.
      details: env.isProduction ? undefined : String((err as Error)?.message ?? err),
    },
  });
}
