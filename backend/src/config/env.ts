import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().url(),

  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url(),

  // ─── AI Providers ───
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL_EN: z.string().default('openai/gpt-oss-120b'),
  GROQ_MODEL_AR: z.string().default('allam-2-7b'),
  GROQ_MODEL_FAST: z.string().default('llama-3.1-8b-instant'),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),

  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default('google/gemini-2.0-flash-exp:free'),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // ─── Voice ───
  VOICE_MODEL: z.string().default('whisper-large-v3-turbo'),
  VOICE_MAX_BYTES: z.coerce.number().int().positive().default(10485760),

  // ─── CORS + Admin ───
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // ─── Demo mode (unsafe for production) ───
  DEMO_MODE: z.coerce.boolean().default(false),
  ADMIN_TOKEN: z.string().optional(),

  // ═════════════════════════════════════════════════════════
  // ARCHITECTURE PROVIDERS (Abstraction Layers)
  // ═════════════════════════════════════════════════════════
  // Free tier: memory + inline + postgres + db + postgres
  // Scale: redis + db + s3 + db + redis (swap via env, no code change)

  CACHE_PROVIDER: z.enum(['memory', 'redis']).default('memory'),
  QUEUE_PROVIDER: z.enum(['inline', 'db']).default('inline'),
  STORAGE_PROVIDER: z.enum(['postgres', 's3']).default('postgres'),
  IDEMPOTENCY_PROVIDER: z.enum(['memory', 'db']).default('db'),
  LOCK_PROVIDER: z.enum(['postgres', 'redis']).default('postgres'),

  // For scale (optional)
  REDIS_URL: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    throw new Error('Invalid environment variables: ' + JSON.stringify(errors));
  }
  cached = parsed.data;
  return cached;
}

export const env = getEnv();