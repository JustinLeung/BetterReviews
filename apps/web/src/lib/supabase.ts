import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Whether Supabase Auth is configured for this client. When false, the app runs
 * in the legacy "no-auth" mode (the API client falls back to the mock-user
 * header) so the plain `docker compose` workflow still works.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Browser Supabase client (or null when not configured). Implicit flow so the
 * magic-link email returns the session in the URL fragment, which
 * `detectSessionInUrl` parses on load — robust even when the link is opened
 * from the local Mailpit mailbox.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'implicit',
      },
    })
  : null;
