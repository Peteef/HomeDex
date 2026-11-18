import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { devParam } from '../devParams.ts';

const parseNumber = (raw: string): number | null => {
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
};

const openAt = (path: string): void => {
  window.history.replaceState(null, '', path);
};

describe('devParam', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    openAt('/');
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('should return nothing when the parameter is not set', () => {
    // Given
    const level = devParam('level', parseNumber);

    // When / Then
    expect(level()).toBeNull();
  });

  it('should return the parsed value when the URL sets the parameter', () => {
    // Given
    openAt('/?dev-level=3');
    const level = devParam('level', parseNumber);

    // When / Then
    expect(level()).toBe(3);
  });

  it('should ignore a parameter without the dev prefix', () => {
    // Given
    openAt('/?level=3');
    const level = devParam('level', parseNumber);

    // When / Then
    expect(level()).toBeNull();
  });

  it('should keep the value for the next page load in the same tab', () => {
    // Given
    openAt('/?dev-level=3');
    devParam('level', parseNumber)();
    openAt('/other');

    // When
    const level = devParam('level', parseNumber);

    // Then
    expect(level()).toBe(3);
  });

  it('should keep the value of this page load after the URL changes', () => {
    // Given
    openAt('/?dev-level=3');
    const level = devParam('level', parseNumber);
    level();

    // When
    openAt('/?dev-level=');

    // Then
    expect(level()).toBe(3);
  });

  it('should clear the value when the URL sets the parameter empty', () => {
    // Given
    openAt('/?dev-level=3');
    devParam('level', parseNumber)();
    openAt('/?dev-level=');
    devParam('level', parseNumber)();
    openAt('/');

    // When
    const level = devParam('level', parseNumber);

    // Then
    expect(level()).toBeNull();
  });

  it('should ignore an invalid value with a warning and keep the stored one', () => {
    // Given
    openAt('/?dev-level=3');
    devParam('level', parseNumber)();
    openAt('/?dev-level=high');

    // When
    const value = devParam('level', parseNumber)();

    // Then
    expect(value).toBeNull();
    expect(console.warn).toHaveBeenCalledWith('Ignoring dev-level=high: not a valid value');
    openAt('/');
    expect(devParam('level', parseNumber)()).toBe(3);
  });

  it('should say in the console that the parameter is on', () => {
    // Given
    openAt('/?dev-level=3');

    // When
    devParam('level', parseNumber)();

    // Then
    expect(console.info).toHaveBeenCalledWith('Dev parameter dev-level=3 is on');
  });

  it('should read the URL and storage only once per page load', () => {
    // Given
    openAt('/?dev-level=3');
    const level = devParam('level', parseNumber);

    // When
    level();
    level();

    // Then
    expect(console.info).toHaveBeenCalledTimes(1);
  });

  it('should still work for one page load when storage is blocked', () => {
    // Given
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    openAt('/?dev-level=3');

    // When
    const level = devParam('level', parseNumber);

    // Then
    expect(level()).toBe(3);
  });

  it('should return nothing in a production build', () => {
    // Given
    vi.stubEnv('DEV', false);
    openAt('/?dev-level=3');

    // When
    const level = devParam('level', parseNumber);

    // Then
    expect(level()).toBeNull();
  });
});
