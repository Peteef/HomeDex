import type Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTestDatabase } from '../../../../infrastructure/__tests__/helpers.ts';
import { AccountError } from '../../errors.ts';
import { userRepository } from '../userRepository.ts';
import type { UserRepository } from '../userRepository.ts';

describe('userRepository', () => {
  let db: Database.Database;
  let users: UserRepository;

  beforeEach(() => {
    db = createTestDatabase();
    users = userRepository(db);
  });

  describe('insert', () => {
    it('should return the stored row when the name is free', () => {
      // When
      const row = users.insert('Ash', 'hash-1', 1_000);

      // Then
      expect(row).toEqual({
        id: expect.any(Number) as number,
        username: 'Ash',
        password_hash: 'hash-1',
        created_at: 1_000,
        archived_at: null,
      });
    });

    it('should throw a taken AccountError when the name exists in another letter case', () => {
      // Given
      users.insert('Ash', 'hash-1', 1_000);

      // When / Then
      expect(() => users.insert('ash', 'hash-2', 2_000)).toThrow(
        expect.objectContaining({ name: 'AccountError', code: 'taken' }),
      );
    });

    it('should rethrow the database error when it is not a taken name', () => {
      // Given
      let thrown: unknown;

      // When
      try {
        users.insert('ash', null as unknown as string, 1_000);
      } catch (error) {
        thrown = error;
      }

      // Then
      expect(thrown).toBeInstanceOf(Error);
      expect(thrown).not.toBeInstanceOf(AccountError);
    });
  });

  describe('findByUsername', () => {
    it('should find the user when the letter case differs', () => {
      // Given
      users.insert('Ash', 'hash-1', 1_000);

      // When
      const row = users.findByUsername('ASH');

      // Then
      expect(row?.username).toBe('Ash');
    });

    it('should return undefined when the name is unknown', () => {
      // When
      const row = users.findByUsername('gary');

      // Then
      expect(row).toBeUndefined();
    });
  });

  describe('list', () => {
    beforeEach(() => {
      users.insert('misty', 'hash', 1_000);
      users.insert('gary', 'hash', 1_000);
      const ash = users.insert('ash', 'hash', 1_000);
      users.setArchivedAt(ash.id, 2_000);
    });

    it('should leave out archived users and sort by username when archived ones are not asked for', () => {
      // When
      const names = users.list(false).map((row) => row.username);

      // Then
      expect(names).toEqual(['gary', 'misty']);
    });

    it('should include archived users when they are asked for', () => {
      // When
      const names = users.list(true).map((row) => row.username);

      // Then
      expect(names).toEqual(['ash', 'gary', 'misty']);
    });
  });

  describe('updateUsername', () => {
    it('should rename the user when the new name is free', () => {
      // Given
      const { id } = users.insert('ash', 'hash', 1_000);

      // When
      users.updateUsername(id, 'ash-k');

      // Then
      expect(users.findByUsername('ash-k')?.id).toBe(id);
      expect(users.findByUsername('ash')).toBeUndefined();
    });

    it('should throw a taken AccountError when the new name belongs to someone else', () => {
      // Given
      const { id } = users.insert('ash', 'hash', 1_000);
      users.insert('misty', 'hash', 1_000);

      // When / Then
      expect(() => {
        users.updateUsername(id, 'Misty');
      }).toThrow(expect.objectContaining({ name: 'AccountError', code: 'taken' }));
    });
  });

  describe('updatePasswordHash', () => {
    it('should replace the hash when given a new one', () => {
      // Given
      const { id } = users.insert('ash', 'old-hash', 1_000);

      // When
      users.updatePasswordHash(id, 'new-hash');

      // Then
      expect(users.findByUsername('ash')?.password_hash).toBe('new-hash');
    });
  });

  describe('setArchivedAt', () => {
    it('should set the archive time when given one', () => {
      // Given
      const { id } = users.insert('ash', 'hash', 1_000);

      // When
      users.setArchivedAt(id, 2_000);

      // Then
      expect(users.findByUsername('ash')?.archived_at).toBe(2_000);
    });

    it('should clear the archive time when given null', () => {
      // Given
      const { id } = users.insert('ash', 'hash', 1_000);
      users.setArchivedAt(id, 2_000);

      // When
      users.setArchivedAt(id, null);

      // Then
      expect(users.findByUsername('ash')?.archived_at).toBeNull();
    });
  });
});
