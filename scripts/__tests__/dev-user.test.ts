import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { AccountsService } from '../../src/platform/backend/domain/accounts/index.ts';
import { domainServices } from '../../src/platform/backend/domain/services.ts';
import { FAST_ARGON2 } from '../../src/platform/backend/infrastructure/__tests__/helpers.ts';
import { openStorage } from '../../src/platform/backend/infrastructure/storage/index.ts';

const SCRIPT = path.join(import.meta.dirname, '..', 'dev-user.ts');
const DEV_ENV = { DEV_USERNAME: 'Tester', DEV_PASSWORD: 'test12345' };

const workDirs: string[] = [];

const newWorkDir = (): string => {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'homedex-dev-user-'));
  workDirs.push(workDir);
  return workDir;
};

const dataDirOf = (workDir: string): string => path.join(workDir, 'data');

// Runs the real script in an empty working folder, so no .env file of the repo leaks in.
const runScript = (env: NodeJS.ProcessEnv, workDir = newWorkDir()) => {
  const dataDir = dataDirOf(workDir);
  const inherited = { ...process.env };
  delete inherited.DEV_USERNAME;
  delete inherited.DEV_PASSWORD;

  const result = spawnSync('node', [SCRIPT], {
    cwd: workDir,
    env: { ...inherited, NODE_ENV: 'development', DATA_DIR: dataDir, ...env },
    encoding: 'utf8',
  });

  return {
    status: result.status,
    output: result.stdout + result.stderr,
    errors: result.stderr,
    dataCreated: fs.existsSync(dataDir),
  };
};

const withAccounts = async <T>(
  workDir: string,
  use: (accounts: AccountsService) => T | Promise<T>,
): Promise<T> => {
  const db = openStorage(dataDirOf(workDir));

  try {
    return await use(domainServices(db, { sessionTtlDays: 1, argon2Params: FAST_ARGON2 }).accounts);
  } finally {
    db.close();
  }
};

const usernamesIn = (workDir: string): Promise<string[]> =>
  withAccounts(workDir, (accounts) =>
    accounts.list({ includeArchived: true }).map(({ username }) => username),
  );

describe('dev user', () => {
  afterEach(() => {
    for (const workDir of workDirs.splice(0)) {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  });

  describe('script', () => {
    it('should create the test user who can then log in when the variables are set', async () => {
      // Given
      const workDir = newWorkDir();

      // When
      const { status, output, dataCreated } = runScript(DEV_ENV, workDir);

      // Then
      expect(status).toBe(0);
      expect(output).toContain('Development test user "Tester": created.');
      expect(dataCreated).toBe(true);

      expect(
        await withAccounts(workDir, (accounts) => accounts.authenticate('Tester', 'test12345')),
      ).not.toBeNull();
    });

    it('should create no user and touch no data when the variables are not set', () => {
      // When
      const { status, output, dataCreated } = runScript({});

      // Then
      expect(status).toBe(0);
      expect(output).toContain('No development test user');
      expect(output).toContain('are not set');
      expect(dataCreated).toBe(false);
    });

    it.each([{ DEV_USERNAME: 'Tester' }, { DEV_PASSWORD: 'test12345' }])(
      'should fail and touch no data when only one variable is set (%o)',
      (env) => {
        // When
        const { status, errors, dataCreated } = runScript(env);

        // Then
        expect(status).toBe(1);
        expect(errors).toContain('Set both DEV_USERNAME and DEV_PASSWORD');
        expect(dataCreated).toBe(false);
      },
    );

    it('should create nothing when any account already exists', async () => {
      // Given
      const workDir = newWorkDir();
      await withAccounts(workDir, (accounts) => accounts.create('Misty', 'fake-password'));

      // When
      const { status, output } = runScript(DEV_ENV, workDir);

      // Then
      expect(status).toBe(0);
      expect(output).toContain('Development test user "Tester": skipped, accounts already exist.');
      expect(await usernamesIn(workDir)).toEqual(['Misty']);
    });

    it('should create nothing when the only account is archived', async () => {
      // Given
      const workDir = newWorkDir();

      await withAccounts(workDir, async (accounts) => {
        await accounts.create('Misty', 'fake-password');
        accounts.archive('Misty');
      });

      // When
      const { status, output } = runScript(DEV_ENV, workDir);

      // Then
      expect(status).toBe(0);
      expect(output).toContain('Development test user "Tester": skipped, accounts already exist.');
      expect(await usernamesIn(workDir)).toEqual(['Misty']);
    });

    it('should fail and stop npm run dev when the password breaks the account rules', () => {
      // When
      const { status, errors } = runScript({ ...DEV_ENV, DEV_PASSWORD: 'short' });

      // Then
      expect(status).toBe(1);
      expect(errors).toContain('Development test user: Password must be at least 8 characters');
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
