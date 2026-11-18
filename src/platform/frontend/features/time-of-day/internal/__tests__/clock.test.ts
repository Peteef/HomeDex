import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const openAt = (path: string): void => {
  window.history.replaceState(null, '', path);
};

// The dev parameter is read once per page load, so each test loads the module fresh.
const loadClock = async () => {
  vi.resetModules();
  return import('../clock.ts');
};

describe('clock', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 5, 1, 10, 30));
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    openAt('/');
    vi.restoreAllMocks();
  });

  describe('currentTime', () => {
    it('should return the real time when no dev hour is set', async () => {
      // Given
      const { currentTime } = await loadClock();

      // When / Then
      expect(currentTime()).toEqual(new Date(2026, 5, 1, 10, 30));
    });

    it.each([
      ['0', new Date(2026, 5, 1, 0, 0)],
      ['22', new Date(2026, 5, 1, 22, 0)],
      ['23', new Date(2026, 5, 1, 23, 0)],
    ])('should return the start of hour %s when the dev hour sets it', async (hour, expected) => {
      // Given
      openAt(`/?dev-hour=${hour}`);
      const { currentTime } = await loadClock();

      // When / Then
      expect(currentTime()).toEqual(expected);
    });

    it.each(['24', '-1', '7.5', 'night', '123'])(
      'should ignore the dev hour %s and return the real time',
      async (hour) => {
        // Given
        openAt(`/?dev-hour=${hour}`);
        const { currentTime } = await loadClock();

        // When / Then
        expect(currentTime()).toEqual(new Date(2026, 5, 1, 10, 30));
      },
    );
  });
});
