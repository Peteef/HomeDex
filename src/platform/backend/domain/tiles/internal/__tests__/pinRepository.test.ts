import type Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createTestDatabase,
  createTestUser,
} from '../../../../infrastructure/__tests__/helpers.ts';
import { pinRepository } from '../pinRepository.ts';
import type { PinRepository } from '../pinRepository.ts';
import { tileRepository } from '../tileRepository.ts';

const NOW = 1_000;

describe('pinRepository', () => {
  let db: Database.Database;
  let pins: PinRepository;
  let userId: number;
  let tileId: number;

  const pinRows = (): unknown[] => db.prepare('SELECT user_id, tile_id FROM pins').all();

  beforeEach(async () => {
    db = createTestDatabase();
    pins = pinRepository(db);
    userId = (await createTestUser(db, 'ash')).id;

    tileId = tileRepository(db).insertLink(
      {
        texts: { en: { title: 'Finances', description: null } },
        icon: 'wallet',
        url: 'https://docs.example.com/finances',
        scope: 'shared',
      },
      userId,
      NOW,
    );
  });

  describe('pin', () => {
    it('should store one row when the tile is pinned', () => {
      // When
      pins.pin(userId, tileId, NOW);

      // Then
      expect(pinRows()).toEqual([{ user_id: userId, tile_id: tileId }]);
    });

    it('should keep one row and not throw when the tile is pinned twice', () => {
      // Given
      pins.pin(userId, tileId, NOW);

      // When
      pins.pin(userId, tileId, NOW + 1);

      // Then
      expect(pinRows()).toHaveLength(1);
    });
  });

  describe('unpin', () => {
    it('should remove the row when the tile is pinned', () => {
      // Given
      pins.pin(userId, tileId, NOW);

      // When
      pins.unpin(userId, tileId);

      // Then
      expect(pinRows()).toEqual([]);
    });

    it('should do nothing when the pin does not exist', () => {
      // When / Then
      expect(() => {
        pins.unpin(userId, tileId);
      }).not.toThrow();

      expect(pinRows()).toEqual([]);
    });
  });
});
