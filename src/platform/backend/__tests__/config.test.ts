import { describe, expect, it } from 'vitest';
import { loadConfig } from '../config.ts';

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
