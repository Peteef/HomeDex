import path from 'node:path';
import { AccountError } from '../src/platform/backend/domain/accounts/index.ts';
import type { AccountsService } from '../src/platform/backend/domain/accounts/index.ts';
import { domainServices } from '../src/platform/backend/domain/services.ts';
import { loadConfig, loadEnvFile } from '../src/platform/backend/infrastructure/config.ts';
import { openStorage } from '../src/platform/backend/infrastructure/storage/index.ts';

// A fixed, publicly known test account for local development only. This script lives outside
// src/, so it is not in the Docker image, and only `npm run dev` runs it.
export const DEV_TEST_USER = { username: 'Tester', password: 'test12345' };

const PRODUCTION = 'production';

export type DevUserResult = 'created' | 'exists';

export const ensureDevUser = async (accounts: AccountsService): Promise<DevUserResult> => {
  try {
    await accounts.create(DEV_TEST_USER.username, DEV_TEST_USER.password);
    return 'created';
  } catch (error) {
    if (error instanceof AccountError && error.code === 'taken') {
      return 'exists';
    }
    throw error;
  }
};

const run = async (): Promise<void> => {
  loadEnvFile();
  const config = loadConfig();
  if (config.NODE_ENV === PRODUCTION) {
    throw new Error('The development test user is never created in production');
  }
  const db = openStorage(path.resolve(config.DATA_DIR));
  try {
    const { accounts } = domainServices(db, { sessionTtlDays: config.SESSION_TTL_DAYS });
    const result = await ensureDevUser(accounts);
    console.log(`Development test user "${DEV_TEST_USER.username}": ${result}.`);
  } finally {
    db.close();
  }
};

if (import.meta.main) {
  await run();
}
