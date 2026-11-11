import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig, loadEnvFile } from '../config.ts';

describe('config', () => {
  describe('loadConfig', () => {
    it('should apply defaults when no variables are set', () => {
      // When
      const config = loadConfig({});

      // Then
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
      // When
      const config = loadConfig({ PORT: '8081', COOKIE_SECURE: 'true' });

      // Then
      expect(config.PORT).toBe(8081);
      expect(config.COOKIE_SECURE).toBe(true);
    });

    it('should throw when a variable is invalid', () => {
      // When / Then
      expect(() => loadConfig({ PORT: 'abc' })).toThrow(/Invalid configuration: PORT/);
      expect(() => loadConfig({ COOKIE_SECURE: 'yes' })).toThrow(/COOKIE_SECURE/);
    });
  });

  describe('development test user variables', () => {
    it.each(['DEV_USERNAME', 'DEV_PASSWORD'])(
      'should refuse to start production when %s is set',
      (name) => {
        // When / Then
        expect(() => loadConfig({ NODE_ENV: 'production', [name]: 'Tester' })).toThrow(
          `${name} are for development only`,
        );
      },
    );

    it('should accept them in development', () => {
      // When
      const config = loadConfig({ DEV_USERNAME: 'Tester', DEV_PASSWORD: 'test12345' });

      // Then
      expect(config.NODE_ENV).toBe('development');
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
      // Given
      const file = path.join(dir, '.env');
      fs.writeFileSync(file, `HOMEDEX_TEST_ENV_FILE_VALUE=from-file\n`);

      // When
      loadEnvFile(file);

      // Then
      expect(process.env.HOMEDEX_TEST_ENV_FILE_VALUE).toBe('from-file');
    });

    it('should do nothing when the file does not exist', () => {
      // When / Then
      expect(() => {
        loadEnvFile(path.join(dir, 'missing.env'));
      }).not.toThrow();
      expect(process.env.HOMEDEX_TEST_ENV_FILE_VALUE).toBeUndefined();
    });
  });
});
