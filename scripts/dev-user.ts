import path from 'node:path';
import type { AccountsService } from '../src/platform/backend/domain/accounts/index.ts';
import { domainServices } from '../src/platform/backend/domain/services.ts';
import { loadConfig, loadEnvFile } from '../src/platform/backend/infrastructure/config.ts';
import { DEV_USER_VARIABLES } from '../src/platform/backend/infrastructure/devConfig.ts';
import { openStorage } from '../src/platform/backend/infrastructure/storage/index.ts';

// A test account for local development, run by `npm run dev` only. Its credentials come from
// .env.development, a file that only this script reads: compose and the server read .env, and
// the server refuses to start in production when these variables are set. This script lives
// outside src/, so it is not in the Docker image.
const DEV_ENV_FILE = '.env.development';
const PRODUCTION = 'production';
const EXIT_FAILURE = 1;

export interface DevUserCredentials {
  username: string;
  password: string;
}

export type DevUserResult = 'created' | 'skipped';

export const devUserCredentials = (env: NodeJS.ProcessEnv): DevUserCredentials | null => {
  const { DEV_USERNAME: username, DEV_PASSWORD: password } = env;
  if (username === undefined && password === undefined) {
    return null;
  }
  if (username === undefined || password === undefined) {
    throw new Error(`Set both ${DEV_USER_VARIABLES.join(' and ')} in ${DEV_ENV_FILE}, or neither`);
  }
  return {
    username,
    password,
  };
};

// Seeds an empty database only, so it never touches a database that already has accounts.
export const ensureDevUser = async (
  accounts: AccountsService,
  { username, password }: DevUserCredentials,
): Promise<DevUserResult> => {
  if (accounts.list({ includeArchived: true }).length > 0) {
    return 'skipped';
  }
  await accounts.create(username, password);
  return 'created';
};

const createDevUser = async (credentials: DevUserCredentials): Promise<void> => {
  const config = loadConfig();
  const db = openStorage(path.resolve(config.DATA_DIR));
  try {
    const { accounts } = domainServices(db, { sessionTtlDays: config.SESSION_TTL_DAYS });
    const result = await ensureDevUser(accounts, credentials);
    const detail = result === 'created' ? 'created' : 'skipped, accounts already exist';
    console.log(`Development test user "${credentials.username}": ${detail}.`);
  } finally {
    db.close();
  }
};

const run = async (): Promise<void> => {
  loadEnvFile();
  loadEnvFile(DEV_ENV_FILE);
  if (process.env.NODE_ENV === PRODUCTION) {
    throw new Error('The development test user is never created in production');
  }
  const credentials = devUserCredentials(process.env);
  if (!credentials) {
    console.log(`No development test user: ${DEV_USER_VARIABLES.join(' and ')} are not set.`);
    return;
  }
  await createDevUser(credentials);
};

if (import.meta.main) {
  try {
    await run();
  } catch (error) {
    console.error(
      `Development test user: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = EXIT_FAILURE;
  }
}
