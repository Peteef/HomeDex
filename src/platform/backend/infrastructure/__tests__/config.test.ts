import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadConfig, loadEnvFile } from '../config.ts';
import { ConfigError } from '../errors.ts';

describe('config', () => {
  describe('loadConfig', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

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
        TRUST_PROXY: 0,
      });
    });

    it('should convert values when variables are set', () => {
      // When
      const config = loadConfig({ PORT: '8081', COOKIE_SECURE: 'true' });

      // Then
      expect(config.PORT).toBe(8081);
      expect(config.COOKIE_SECURE).toBe(true);
    });

    it('should read the number of trusted proxies when TRUST_PROXY is a number', () => {
      // When
      const config = loadConfig({ TRUST_PROXY: '1' });

      // Then
      expect(config.TRUST_PROXY).toBe(1);
    });

    it.each(['true', 'false', '-1', '1.5'])(
      'should reject TRUST_PROXY when it is not a whole number from 0 up (%s)',
      (value) => {
        // When / Then
        expect(() => loadConfig({ TRUST_PROXY: value })).toThrow(
          /Invalid configuration: TRUST_PROXY/,
        );
      },
    );

    it('should accept a time zone when it is an IANA name', () => {
      // When
      const config = loadConfig({ TZ: 'Europe/Warsaw' });

      // Then
      expect(config.TZ).toBe('Europe/Warsaw');
    });

    it('should reject a time zone when it is unknown', () => {
      // When / Then
      expect(() => loadConfig({ TZ: 'Europe/Atlantis' })).toThrow(/Invalid configuration: TZ/);
    });

    it('should leave the time zone to the system when TZ is not set', () => {
      // Given
      vi.stubEnv('TZ', 'Asia/Tokyo');

      // When
      const config = loadConfig({});

      // Then
      expect(config.TZ).toBe('Asia/Tokyo');
    });

    it('should refuse production when a development test user variable is set', () => {
      // When / Then
      expect(() => loadConfig({ NODE_ENV: 'production', DEV_USERNAME: 'Tester' })).toThrow(
        ConfigError,
      );

      expect(() => loadConfig({ NODE_ENV: 'production', DEV_USERNAME: 'Tester' })).toThrow(
        /for development only/,
      );
    });

    it('should throw when a variable is invalid', () => {
      // When / Then
      expect(() => loadConfig({ PORT: 'abc' })).toThrow(ConfigError);
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
