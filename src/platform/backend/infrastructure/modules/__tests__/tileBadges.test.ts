import { describe, expect, it, vi } from 'vitest';
import type { Logger } from '../../logger.ts';
import { ModuleError } from '../errors.ts';
import { tileBadges } from '../tileBadges.ts';

const silentLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe('tileBadges', () => {
  describe('badgeOf', () => {
    it('should return the count when it is above 0', () => {
      // Given
      const badges = tileBadges();
      badges.set('notes', () => 7, silentLogger());

      // When
      const badge = badges.badgeOf('notes');

      // Then
      expect(badge).toBe(7);
    });

    it('should return null when the count is 0', () => {
      // Given
      const badges = tileBadges();
      badges.set('notes', () => 0, silentLogger());

      // When
      const badge = badges.badgeOf('notes');

      // Then
      expect(badge).toBeNull();
    });

    it('should return null when the module set no badge', () => {
      // Given
      const badges = tileBadges();
      badges.set('notes', () => 7, silentLogger());

      // When
      const badge = badges.badgeOf('clock');

      // Then
      expect(badge).toBeNull();
    });

    it('should call the count on every request when the count changes', () => {
      // Given
      const badges = tileBadges();
      const count = vi.fn().mockReturnValueOnce(2).mockReturnValueOnce(1);
      badges.set('notes', count, silentLogger());

      // When
      const counts = [badges.badgeOf('notes'), badges.badgeOf('notes')];

      // Then
      expect(counts).toEqual([2, 1]);
    });

    it('should log the error with the module logger and return null when the count throws', () => {
      // Given
      const badges = tileBadges();
      const error = vi.fn();
      const logger = { ...silentLogger(), error };
      const failure = new Error('database locked');

      badges.set(
        'notes',
        () => {
          throw failure;
        },
        logger,
      );

      // When
      const badge = badges.badgeOf('notes');

      // Then
      expect(badge).toBeNull();
      expect(error).toHaveBeenCalledWith('The tile badge failed', failure);
    });
  });

  describe('set', () => {
    it('should throw a ModuleError when a module sets its badge twice', () => {
      // Given
      const badges = tileBadges();
      badges.set('notes', () => 1, silentLogger());

      // When / Then
      expect(() => {
        badges.set('notes', () => 2, silentLogger());
      }).toThrow(new ModuleError('Module "notes" set its tile badge twice'));
    });
  });
});
