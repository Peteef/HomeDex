import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { E2E_ARCHIVED_USER, E2E_DATA_DIR, E2E_USER } from './fixtures.ts';

const USERS_CLI = 'src/platform/backend/infrastructure/cli/users.ts';

const users = (...args: string[]): void => {
  const result = spawnSync('node', [USERS_CLI, ...args], {
    env: { ...process.env, DATA_DIR: E2E_DATA_DIR },
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`users ${args.join(' ')} failed`);
  }
};

fs.rmSync(E2E_DATA_DIR, { recursive: true, force: true });

for (const { username, password } of [E2E_USER, E2E_ARCHIVED_USER]) {
  users('create', username, '--password', password);
}

users('archive', E2E_ARCHIVED_USER.username, '--yes');
