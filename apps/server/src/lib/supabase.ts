import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { logger } from './logger';

/**
 * Lazily-created Supabase client using the service-role key (server-side only).
 *
 * Returns null when Supabase is not configured (the default for local Docker
 * development, which uses plain Postgres). This keeps the local dev path free
 * of Supabase while leaving a clear hook for staging/production.
 *
 * TODO: use this client for Supabase Storage uploads (signed URLs) and for
 * verifying Supabase Auth JWTs — see middleware/auth.ts.
 */
let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  if (!env.supabaseUrl || !env.SUPABASE_SERVICE_ROLE_KEY) {
    logger.info('Supabase not configured — running with local Postgres only.');
    cached = null;
    return cached;
  }

  cached = createClient(env.supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
