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
import { devUserCredentials, ensureDevUser } from '../dev-user.ts';

const SCRIPT = path.join(import.meta.dirname, '..', 'dev-user.ts');
const CREDENTIALS = { username: 'Tester', password: 'test12345' };
const DEV_ENV = { DEV_USERNAME: CREDENTIALS.username, DEV_PASSWORD: CREDENTIALS.password };

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'homedex-dev-user-'));

// Runs the real script in an empty working folder, so no .env file of the repo leaks in.
const runScript = (env: NodeJS.ProcessEnv) => {
  const workDir = tempDir();
  const dataDir = path.join(workDir, 'data');
  const inherited = { ...process.env };
  delete inherited.DEV_USERNAME;
  delete inherited.DEV_PASSWORD;

  const result = spawnSync('node', [SCRIPT], {
    cwd: workDir,
    env: { ...inherited, NODE_ENV: 'development', DATA_DIR: dataDir, ...env },
    encoding: 'utf8',
  });

  const dataCreated = fs.existsSync(dataDir);
  fs.rmSync(workDir, { recursive: true, force: true });
  return {
    status: result.status,
    output: result.stdout + result.stderr,
    dataCreated,
  };
};

const testAccounts = () =>
  domainServices(createTestDatabase(), { sessionTtlDays: 1, argon2Params: FAST_ARGON2 }).accounts;

describe('dev user', () => {
  describe('devUserCredentials', () => {
    it('should return the credentials when both variables are set', () => {
      // When / Then
      expect(devUserCredentials(DEV_ENV)).toEqual(CREDENTIALS);
    });

    it('should return null when neither variable is set', () => {
      // When / Then
      expect(devUserCredentials({})).toBeNull();
    });

    it.each([{ DEV_USERNAME: 'Tester' }, { DEV_PASSWORD: 'test12345' }])(
      'should throw when only one variable is set (%o)',
      (env) => {
        // When / Then
        expect(() => devUserCredentials(env)).toThrow(/Set both DEV_USERNAME and DEV_PASSWORD/);
      },
    );
  });

  describe('ensureDevUser', () => {
    it('should create the test user who can then log in when there are no accounts', async () => {
      // Given
      const accounts = testAccounts();

      // When
      const result = await ensureDevUser(accounts, CREDENTIALS);

      // Then
      expect(result).toBe('created');
      expect(await accounts.authenticate('Tester', 'test12345')).not.toBeNull();
    });

    it('should create nothing when any account already exists', async () => {
      // Given
      const accounts = testAccounts();
      await accounts.create('Misty', 'fake-password');

      // When
      const result = await ensureDevUser(accounts, CREDENTIALS);

      // Then
      expect(result).toBe('skipped');
      expect(accounts.list().map(({ username }) => username)).toEqual(['Misty']);
    });

    it('should create nothing when the only account is archived', async () => {
      // Given
      const accounts = testAccounts();
      await accounts.create('Misty', 'fake-password');
      accounts.archive('Misty');

      // When
      const result = await ensureDevUser(accounts, CREDENTIALS);

      // Then
      expect(result).toBe('skipped');
    });

    it('should reject credentials that break the account rules', async () => {
      // Given
      const accounts = testAccounts();

      // When / Then
      await expect(
        ensureDevUser(accounts, { username: 'Tester', password: 'short' }),
      ).rejects.toThrow(/password/i);
    });
  });

  describe('script', () => {
    it('should create the test user when the variables are set', () => {
      // When
      const { status, output, dataCreated } = runScript(DEV_ENV);

      // Then
      expect(status).toBe(0);
      expect(output).toContain('Development test user "Tester": created.');
      expect(dataCreated).toBe(true);
    });

    it('should create no user and touch no data when the variables are not set', () => {
      // When
      const { status, output, dataCreated } = runScript({});

      // Then
      expect(status).toBe(0);
      expect(output).toContain('No development test user');
      expect(dataCreated).toBe(false);
    });

    it('should fail and stop npm run dev when the password breaks the account rules', () => {
      // When
      const { status, output } = runScript({ ...DEV_ENV, DEV_PASSWORD: 'short' });

      // Then
      expect(status).not.toBe(0);
      expect(output).toContain('Development test user:');
    });

    it('should refuse to run and touch no data when NODE_ENV is production', () => {
      // When
      const { status, output, dataCreated } = runScript({ ...DEV_ENV, NODE_ENV: 'production' });

      // Then
      expect(status).not.toBe(0);
      expect(output).toContain('never created in production');
      expect(dataCreated).toBe(false);
    });
  });
});
