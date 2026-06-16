import 'dotenv/config';
import { z } from 'zod';

/**
 * Centralized, validated environment configuration. Importing this module
 * fails fast (with a readable message) if required variables are missing.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required (see .env.example)'),

  // Local-development-only mock auth. See middleware/auth.ts.
  MOCK_USER_ID: z.string().uuid().optional(),

  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  // Optional locally; needed for hosted Supabase (auth/storage) later.
  SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(
    '❌ Invalid environment configuration:\n' +
      parsed.error.issues
        .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('\n'),
  );
  process.exit(1);
}

const data = parsed.data;

export const env = {
  ...data,
  isProduction: data.NODE_ENV === 'production',
  isDevelopment: data.NODE_ENV === 'development',
  corsOrigins: data.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  supabaseUrl: data.SUPABASE_URL || undefined,
};

export type Env = typeof env;
