import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestDatabase } from '../../__tests__/helpers.ts';
import { currentUser } from '../../http/auth/currentUser.ts';
import { logger } from '../../logger.ts';
import { moduleContext } from '../moduleContext.ts';
import { tileBadges } from '../tileBadges.ts';

const TODAY = () => '2026-04-01';

describe('moduleContext', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should give the module its id, the storage, a router, currentUser and today when it is created', () => {
    // Given
    const storage = createTestDatabase();

    // When
    const ctx = moduleContext('notes', storage, TODAY, tileBadges());

    // Then
    expect(ctx.id).toBe('notes');
    expect(ctx.storage).toBe(storage);
    expect(ctx.router).toEqual(expect.any(Function));
    expect(ctx.router.get).toEqual(expect.any(Function));
    expect(ctx.currentUser).toBe(currentUser);
    expect(ctx.today()).toBe('2026-04-01');
  });

  it('should start every log line with the module id and pass details on when the module logs', () => {
    // Given
    const info = vi.spyOn(logger, 'info').mockImplementation(() => undefined);
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
    const error = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    const moduleLogger = moduleContext('notes', createTestDatabase(), TODAY, tileBadges()).logger;
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

  it('should give the badge count to the tile badges under the module id when the module sets it', () => {
    // Given
    const badges = tileBadges();
    const ctx = moduleContext('notes', createTestDatabase(), TODAY, badges);

    // When
    ctx.setTileBadge(() => 3);

    // Then
    expect(badges.badgeOf('notes')).toBe(3);
    expect(badges.badgeOf('clock')).toBeNull();
  });

  it('should log a failing badge count with the module id when the tiles ask for it', () => {
    // Given
    const error = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    const badges = tileBadges();
    const failure = new Error('database locked');
    const ctx = moduleContext('notes', createTestDatabase(), TODAY, badges);

    ctx.setTileBadge(() => {
      throw failure;
    });

    // When
    const badge = badges.badgeOf('notes');

    // Then
    expect(badge).toBeNull();
    expect(error).toHaveBeenCalledWith('[notes] The tile badge failed', failure);
  });
});
