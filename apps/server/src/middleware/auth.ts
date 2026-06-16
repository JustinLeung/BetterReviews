import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { ApiError } from '../lib/errors';
import { logger } from '../lib/logger';
import { getSupabase } from '../lib/supabase';

/**
 * Resolves the current user and attaches `req.userId`.
 *
 * Resolution order:
 *   1. Supabase Auth JWT in `Authorization: Bearer <token>`. The token is
 *      validated server-side via the GoTrue `/user` endpoint. A profile row in
 *      public.users is guaranteed by the on-signup trigger (see
 *      sql/supabase_auth.sql), so `data.user.id` is a valid users.id.
 *   2. Local-development-only mock auth: the `x-mock-user-id` header, or the
 *      MOCK_USER_ID env var. Disabled when NODE_ENV=production.
 */
export async function attachUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // --- 1. Real auth: Supabase JWT --------------------------------------
    const token = req.header('authorization')?.replace(/^Bearer\s+/i, '').trim();
    if (token) {
      const supabase = getSupabase();
      if (supabase) {
        // TODO(perf): verify the JWT signature locally with the project's JWT
        // secret to avoid a network round-trip per authenticated request.
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) {
          return next(ApiError.unauthorized('Invalid or expired session token.'));
        }
        req.userId = data.user.id;
        return next();
      }
      logger.warn('Received a Bearer token but Supabase is not configured; ignoring it.');
    }

    // --- 2. Mock auth (local development only) ----------------------------
    if (!env.isProduction) {
      const headerUser = req.header('x-mock-user-id');
      req.userId = headerUser?.trim() || env.MOCK_USER_ID || null;
    } else {
      req.userId = null;
    }
    next();
  } catch (err) {
    next(err);
  }
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
        'Authentication required. Sign in, or in local dev set MOCK_USER_ID / send an x-mock-user-id header.',
      ),
    );
  }
  next();
}
