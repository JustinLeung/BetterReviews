import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { ApiError } from '../lib/errors';
import { logger } from '../lib/logger';

/**
 * Resolves the current user and attaches `req.userId`.
 *
 * Resolution order:
 *   1. Supabase Auth JWT in `Authorization: Bearer <token>` — STUBBED for now.
 *   2. Local-development-only mock auth:
 *        - `x-mock-user-id` request header, or
 *        - the MOCK_USER_ID environment variable.
 *
 * Mock auth is intended ONLY for local development. In production, MOCK_USER_ID
 * should be unset and real JWT verification should be wired up below.
 */
export async function attachUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  // --- 1. Real auth (future) ------------------------------------------------
  // TODO: verify the Supabase JWT and set req.userId from its `sub` claim.
  //
  //   const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  //   if (token) {
  //     const supabase = getSupabase();
  //     const { data, error } = await supabase!.auth.getUser(token);
  //     if (!error && data.user) { req.userId = data.user.id; return next(); }
  //   }
  const bearer = req.header('authorization');
  if (bearer && env.isProduction) {
    logger.warn('Received Authorization header but JWT verification is not implemented yet.');
  }

  // --- 2. Mock auth (local development only) --------------------------------
  if (!env.isProduction) {
    const headerUser = req.header('x-mock-user-id');
    req.userId = headerUser?.trim() || env.MOCK_USER_ID || null;
  } else {
    req.userId = null;
  }

  next();
}

/** Guards routes that require an authenticated user. */
export function requireUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.userId) {
    return next(
      ApiError.unauthorized(
        'Authentication required. In local dev, set MOCK_USER_ID or send an x-mock-user-id header.',
      ),
    );
  }
  next();
}
