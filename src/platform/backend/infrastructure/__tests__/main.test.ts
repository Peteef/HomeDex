import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openStorage } from '../storage/index.ts';

const MAIN = path.resolve(import.meta.dirname, '../main.ts');

describe('main', () => {
  let workDir: string;

  const run = (env: Record<string, string>) =>
    spawnSync('node', [MAIN], {
      cwd: workDir,
      env: { ...process.env, DATA_DIR: workDir, ...env },
      encoding: 'utf8',
      timeout: 20_000,
    });

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'homedex-main-'));
  });

  afterEach(() => {
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  it('should print one line and exit with 1 when a setting is invalid', () => {
    // When
    const result = run({ PORT: 'abc' });

    // Then
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Invalid configuration: PORT');
    expect(result.stderr).not.toContain('    at ');
    expect(fs.existsSync(path.join(workDir, 'homedex.db'))).toBe(false);
  });

  it('should print one line and exit with 1 when a development variable is set in production', () => {
    // When
    const result = run({ NODE_ENV: 'production', DEV_USERNAME: 'ash' });

    // Then
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('DEV_USERNAME');
    expect(result.stderr).toContain('development only');
    expect(result.stderr).not.toContain('    at ');
  });

  it('should print one line and exit with 1 when an applied migration was edited', () => {
    // Given
    const db = openStorage(workDir);

    db.prepare(
      "UPDATE schema_migrations SET checksum = 'edited' WHERE scope = 'platform' AND version = 1",
    ).run();

    db.close();

    // When
    const result = run({});

    // Then
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('001_users.sql');
    expect(result.stderr).toContain('was changed after it was applied');
    expect(result.stderr).not.toContain('    at ');
  });
});
