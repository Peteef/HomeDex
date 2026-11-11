import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { domainServices } from '../../src/platform/backend/domain/services.ts';
import {
  createTestDatabase,
  FAST_ARGON2,
} from '../../src/platform/backend/infrastructure/__tests__/helpers.ts';
import { DEV_TEST_USER, ensureDevUser } from '../dev-user.ts';

const SCRIPT = path.join(import.meta.dirname, '..', 'dev-user.ts');

const runScript = (nodeEnv: string) => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'homedex-dev-user-'));
  const result = spawnSync('node', [SCRIPT], {
    env: { ...process.env, NODE_ENV: nodeEnv, DATA_DIR: dataDir },
    encoding: 'utf8',
  });
  const created = fs.readdirSync(dataDir);
  fs.rmSync(dataDir, { recursive: true, force: true });
  return {
    status: result.status,
    output: result.stdout + result.stderr,
    created,
  };
};

const testAccounts = () =>
  domainServices(createTestDatabase(), { sessionTtlDays: 1, argon2Params: FAST_ARGON2 }).accounts;

describe('dev user', () => {
  describe('ensureDevUser', () => {
    it('should create the test user who can then log in when it does not exist', async () => {
      // Given
      const accounts = testAccounts();

      // When
      const result = await ensureDevUser(accounts);

      // Then
      expect(result).toBe('created');
      const account = await accounts.authenticate('Tester', 'test12345');
      expect(account?.username).toBe(DEV_TEST_USER.username);
    });

    it('should leave the test user alone when it already exists', async () => {
      // Given
      const accounts = testAccounts();
      await ensureDevUser(accounts);

      // When
      const result = await ensureDevUser(accounts);

      // Then
      expect(result).toBe('exists');
      expect(accounts.list({ includeArchived: true })).toHaveLength(1);
    });

    it('should keep other accounts untouched', async () => {
      // Given
      const accounts = testAccounts();
      await accounts.create('Misty', 'fake-password');

      // When
      await ensureDevUser(accounts);

      // Then
      expect(accounts.list().map(({ username }) => username)).toEqual(['Misty', 'Tester']);
    });
  });

  describe('script', () => {
    it('should create the test user in the data folder when run for development', () => {
      // When
      const { status, output, created } = runScript('development');

      // Then
      expect(status).toBe(0);
      expect(output).toContain('Development test user "Tester": created.');
      expect(created).toContain('homedex.db');
    });

    it('should refuse to run and touch no data when NODE_ENV is production', () => {
      // When
      const { status, output, created } = runScript('production');

      // Then
      expect(status).not.toBe(0);
      expect(output).toContain('never created in production');
      expect(created).toEqual([]);
    });
  });
});
