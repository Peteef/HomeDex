import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestDatabase } from '../../__tests__/helpers.ts';
import { currentUser } from '../../http/auth/currentUser.ts';
import { logger } from '../../logger.ts';
import { moduleContext } from '../moduleContext.ts';

describe('moduleContext', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should give the module its id, the storage, a router and currentUser when it is created', () => {
    // Given
    const storage = createTestDatabase();

    // When
    const ctx = moduleContext('notes', storage);

    // Then
    expect(ctx.id).toBe('notes');
    expect(ctx.storage).toBe(storage);
    expect(ctx.router).toEqual(expect.any(Function));
    expect(ctx.router.get).toEqual(expect.any(Function));
    expect(ctx.currentUser).toBe(currentUser);
  });

  it('should start every log line with the module id and pass details on when the module logs', () => {
    // Given
    const info = vi.spyOn(logger, 'info').mockImplementation(() => undefined);
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
    const error = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    const moduleLogger = moduleContext('notes', createTestDatabase()).logger;
    const details = { id: 1 };

    // When
    moduleLogger.info('started', details);
    moduleLogger.warn('slow', details);
    moduleLogger.error('failed', details);

    // Then
    expect(info).toHaveBeenCalledWith('[notes] started', details);
    expect(warn).toHaveBeenCalledWith('[notes] slow', details);
    expect(error).toHaveBeenCalledWith('[notes] failed', details);
  });
});
