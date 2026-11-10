import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../logger.ts';

describe('logger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['info', 'log'],
    ['warn', 'warn'],
    ['error', 'error'],
  ] as const)('should write %s messages with their details to console.%s', (level, method) => {
    const write = vi.spyOn(console, method).mockImplementation(() => undefined);
    logger[level]('something happened', { id: 1 });
    expect(write).toHaveBeenCalledWith('something happened', { id: 1 });
  });
});
