import { execFileSync } from 'node:child_process';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { appVersion } from '../app-version.ts';

vi.mock('node:child_process', () => ({ execFileSync: vi.fn() }));

const git = vi.mocked(execFileSync);

describe('appVersion', () => {
  afterEach(() => {
    git.mockReset();
  });

  it('should use APP_VERSION when it is set', () => {
    // When / Then
    expect(appVersion({ APP_VERSION: '1.4.1' })).toBe('1.4.1');
    expect(git).not.toHaveBeenCalled();
  });

  it('should mark the last release tag as dev when APP_VERSION is not set', () => {
    // Given
    git.mockReturnValue('v1.4.1\n');

    // When
    const version = appVersion({});

    // Then
    expect(version).toBe('1.4.1-dev');

    expect(git).toHaveBeenCalledWith(
      'git',
      ['describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*'],
      expect.anything(),
    );
  });

  it('should treat an empty APP_VERSION as not set', () => {
    // Given
    git.mockReturnValue('v2.0.0\n');

    // When / Then
    expect(appVersion({ APP_VERSION: '' })).toBe('2.0.0-dev');
  });

  it('should fall back to 0.0.0-dev when git finds no release tag', () => {
    // Given
    git.mockImplementation(() => {
      throw new Error('fatal: No names found, cannot describe anything.');
    });

    // When / Then
    expect(appVersion({})).toBe('0.0.0-dev');
  });
});
