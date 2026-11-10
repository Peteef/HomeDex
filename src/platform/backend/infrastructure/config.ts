import fs from 'node:fs';
import { z } from 'zod';

export const DEFAULT_PORT = 3000;
const MAX_PORT = 65535;
const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_DATA_DIR = './data';
const DEFAULT_ASSETS_DIR = './assets';
const DEFAULT_SESSION_TTL_DAYS = 365;
const ENV_FILE = '.env';

const booleanFlag = z.enum(['true', 'false']).transform((value) => value === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(MAX_PORT).default(DEFAULT_PORT),
  HOST: z.string().min(1).default(DEFAULT_HOST),
  DATA_DIR: z.string().min(1).default(DEFAULT_DATA_DIR),
  ASSETS_DIR: z.string().min(1).default(DEFAULT_ASSETS_DIR),
  COOKIE_SECURE: booleanFlag.default(false),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).default(DEFAULT_SESSION_TTL_DAYS),
  TRUST_PROXY: booleanFlag.default(false),
});

export type Config = z.infer<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = schema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid configuration: ${problems}`);
  }
  return result.data;
}

export function loadEnvFile(file = ENV_FILE): void {
  if (fs.existsSync(file)) process.loadEnvFile(file);
}
