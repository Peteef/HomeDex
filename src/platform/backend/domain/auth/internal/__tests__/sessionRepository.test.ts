import type Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createTestDatabase,
  createTestUser,
} from '../../../../infrastructure/__tests__/helpers.ts';
import { sessionRepository } from '../sessionRepository.ts';
import type { NewSession, SessionRepository } from '../sessionRepository.ts';

const CREATED_AT = 10_000;
const EXPIRES_AT = 20_000;

describe('sessionRepository', () => {
  let db: Database.Database;
  let sessions: SessionRepository;
  let ash: number;

  const session = (overrides: Partial<NewSession> = {}): NewSession => ({
    tokenHash: 'hash-1',
    userId: ash,
    now: CREATED_AT,
    expiresAt: EXPIRES_AT,
    userAgent: null,
    ...overrides,
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
    ash = (await createTestUser(db, 'ash')).id;
  });

  describe('insert', () => {
    it('should store a session that findActive returns with its user and last use', () => {
      // When
      sessions.insert(session());

      // Then
      expect(sessions.findActive('hash-1', CREATED_AT)).toEqual({
        user_id: ash,
        username: 'ash',
        last_seen_at: CREATED_AT,
      });
    });
  });

  describe('findActive', () => {
    it('should return undefined when the token hash is unknown', () => {
      // When
      const row = sessions.findActive('unknown', CREATED_AT);

      // Then
      expect(row).toBeUndefined();
    });

    it('should return undefined when the session expires at that moment', () => {
      // Given
      sessions.insert(session());

      // When
      const row = sessions.findActive('hash-1', EXPIRES_AT);

      // Then
      expect(row).toBeUndefined();
    });

    it('should return undefined when the user is archived', () => {
      // Given
      sessions.insert(session());
      db.prepare('UPDATE users SET archived_at = ? WHERE id = ?').run(CREATED_AT, ash);

      // When
      const row = sessions.findActive('hash-1', CREATED_AT);

      // Then
      expect(row).toBeUndefined();
    });
  });

  describe('touch', () => {
    it('should move the last use and the expiry when the session is used', () => {
      // Given
      sessions.insert(session());

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
      sessions.insert(session({ tokenHash: 'hash-1' }));
      sessions.insert(session({ tokenHash: 'hash-2' }));

      // When
      sessions.delete('hash-1');

      // Then
      expect(tokenHashes()).toEqual(['hash-2']);
    });
  });

  describe('deleteForUser', () => {
    it("should remove only that user's sessions when two users are signed in", async () => {
      // Given
      const misty = (await createTestUser(db, 'misty')).id;
      sessions.insert(session({ tokenHash: 'ash-1' }));
      sessions.insert(session({ tokenHash: 'ash-2' }));
      sessions.insert(session({ tokenHash: 'misty-1', userId: misty }));

      // When
      sessions.deleteForUser(ash);

      // Then
      expect(tokenHashes()).toEqual(['misty-1']);
    });
  });

  describe('deleteExpired', () => {
    it('should remove sessions that expire by now and keep later ones when cleaning up', () => {
      // Given
      sessions.insert(session({ tokenHash: 'expired', expiresAt: 5_000 }));
      sessions.insert(session({ tokenHash: 'expires-now', expiresAt: CREATED_AT }));
      sessions.insert(session({ tokenHash: 'active', expiresAt: EXPIRES_AT }));

      // When
      sessions.deleteExpired(CREATED_AT);

      // Then
      expect(tokenHashes()).toEqual(['active']);
    });
  });
});
