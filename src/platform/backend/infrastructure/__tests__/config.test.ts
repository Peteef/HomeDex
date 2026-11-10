import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig, loadEnvFile } from '../config.ts';

describe('loadConfig', () => {
  it('should apply defaults when no variables are set', () => {
    const config = loadConfig({});
    expect(config).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      HOST: '0.0.0.0',
      COOKIE_SECURE: false,
      SESSION_TTL_DAYS: 365,
      TRUST_PROXY: false,
    });
  });

  it('should convert values when variables are set', () => {
    const config = loadConfig({ PORT: '8081', COOKIE_SECURE: 'true' });
    expect(config.PORT).toBe(8081);
    expect(config.COOKIE_SECURE).toBe(true);
  });

  it('should throw when a variable is invalid', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(/Invalid configuration: PORT/);
    expect(() => loadConfig({ COOKIE_SECURE: 'yes' })).toThrow(/COOKIE_SECURE/);
  });
});

describe('loadEnvFile', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'homedex-env-'));
  });

  afterEach(() => {
    delete process.env.HOMEDEX_TEST_ENV_FILE_VALUE;
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('should load the variables into the environment when the file exists', () => {
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, `HOMEDEX_TEST_ENV_FILE_VALUE=from-file\n`);
    loadEnvFile(file);
    expect(process.env.HOMEDEX_TEST_ENV_FILE_VALUE).toBe('from-file');
  });

  it('should do nothing when the file does not exist', () => {
    expect(() => {
      loadEnvFile(path.join(dir, 'missing.env'));
    }).not.toThrow();
    expect(process.env.HOMEDEX_TEST_ENV_FILE_VALUE).toBeUndefined();
  });
});
