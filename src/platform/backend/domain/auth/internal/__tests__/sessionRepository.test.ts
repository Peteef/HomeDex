import type Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createTestDatabase,
  createTestUser,
} from '../../../../infrastructure/__tests__/helpers.ts';
import { sessionRepository } from '../sessionRepository.ts';
import type { NewSession, SessionRepository } from '../sessionRepository.ts';

const NOW = 10_000;
const LATER = 20_000;

describe('sessionRepository', () => {
  let db: Database.Database;
  let sessions: SessionRepository;
  let userId: number;

  const userIdOf = (username: string): number =>
    (db.prepare('SELECT id FROM users WHERE username = ?').get(username) as { id: number }).id;

  const sessionFor = (tokenHash: string, owner = userId, expiresAt = LATER): NewSession => ({
    tokenHash,
    userId: owner,
    now: NOW,
    expiresAt,
    userAgent: null,
  });

  const tokenHashes = (): string[] =>
    (
      db.prepare('SELECT token_hash FROM sessions ORDER BY token_hash').all() as {
        token_hash: string;
      }[]
    ).map((row) => row.token_hash);

  beforeEach(async () => {
    db = createTestDatabase();
    sessions = sessionRepository(db);
    await createTestUser(db, 'ash');
    userId = userIdOf('ash');
  });

  describe('insert and findActive', () => {
    it('should return the user and the last use when the session is active', () => {
      // Given
      sessions.insert(sessionFor('hash-1'));

      // When
      const row = sessions.findActive('hash-1', NOW);

      // Then
      expect(row).toEqual({ user_id: userId, username: 'ash', last_seen_at: NOW });
    });
  });

  describe('findActive', () => {
    it('should return undefined when the token hash is unknown', () => {
      // When
      const row = sessions.findActive('unknown', NOW);

      // Then
      expect(row).toBeUndefined();
    });

    it('should return undefined when the session expires now', () => {
      // Given
      sessions.insert(sessionFor('hash-1'));

      // When
      const row = sessions.findActive('hash-1', LATER);

      // Then
      expect(row).toBeUndefined();
    });

    it('should return undefined when the user is archived', () => {
      // Given
      sessions.insert(sessionFor('hash-1'));
      db.prepare('UPDATE users SET archived_at = ? WHERE id = ?').run(NOW, userId);

      // When
      const row = sessions.findActive('hash-1', NOW);

      // Then
      expect(row).toBeUndefined();
    });
  });

  describe('touch', () => {
    it('should move the last use and the expiry when the session is used', () => {
      // Given
      sessions.insert(sessionFor('hash-1'));

      // When
      sessions.touch('hash-1', 15_000, 30_000);

      // Then
      const row = db
        .prepare('SELECT last_seen_at, expires_at FROM sessions WHERE token_hash = ?')
        .get('hash-1');

      expect(row).toEqual({ last_seen_at: 15_000, expires_at: 30_000 });
    });
  });

  describe('delete', () => {
    it('should remove only that session when there are others', () => {
      // Given
      sessions.insert(sessionFor('hash-1'));
      sessions.insert(sessionFor('hash-2'));

      // When
      sessions.delete('hash-1');

      // Then
      expect(tokenHashes()).toEqual(['hash-2']);
    });
  });

  describe('deleteForUser', () => {
    it("should remove only that user's sessions when two users are signed in", async () => {
      // Given
      await createTestUser(db, 'misty');
      sessions.insert(sessionFor('ash-1'));
      sessions.insert(sessionFor('ash-2'));
      sessions.insert(sessionFor('misty-1', userIdOf('misty')));

      // When
      sessions.deleteForUser(userId);

      // Then
      expect(tokenHashes()).toEqual(['misty-1']);
    });
  });

  describe('deleteExpired', () => {
    it('should remove sessions that expire by now and keep later ones when cleaning up', () => {
      // Given
      sessions.insert(sessionFor('expired', userId, 5_000));
      sessions.insert(sessionFor('expires-now', userId, NOW));
      sessions.insert(sessionFor('active', userId, LATER));

      // When
      sessions.deleteExpired(NOW);

      // Then
      expect(tokenHashes()).toEqual(['active']);
    });
  });
});
