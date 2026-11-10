import type Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTestDatabase, createTestUser } from '../../../infrastructure/__tests__/helpers.ts';
import { sessionService, SLIDE_AFTER_MS } from '../sessionService.ts';
import type { SessionService } from '../sessionService.ts';

const DAY = 24 * 60 * 60 * 1000;
const TTL_DAYS = 30;

describe('session service', () => {
  let db: Database.Database;
  let clock: { now: number };
  let sessions: SessionService;
  let userId: number;

  const countRows = (): number =>
    (db.prepare('SELECT COUNT(*) AS n FROM sessions').get() as { n: number }).n;

  beforeEach(async () => {
    db = createTestDatabase();
    clock = { now: Date.UTC(2026, 0, 1) };
    sessions = sessionService(db, { ttlDays: TTL_DAYS, now: () => clock.now });
    await createTestUser(db, 'ash');
    userId = (db.prepare('SELECT id FROM users').get() as { id: number }).id;
  });

  describe('create', () => {
    it('should store only a hash of the token', () => {
      // When
      const { token } = sessions.create(userId, undefined);

      // Then
      const row = db.prepare('SELECT token_hash FROM sessions').get() as { token_hash: string };
      expect(row.token_hash).not.toBe(token);
      expect(row.token_hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should set the expiry to the end of the session lifetime', () => {
      // When
      const { expiresAt } = sessions.create(userId, undefined);

      // Then
      expect(expiresAt).toBe(clock.now + TTL_DAYS * DAY);
    });

    it('should purge expired sessions when a new session is created', () => {
      // Given
      sessions.create(userId, undefined);
      clock.now += TTL_DAYS * DAY + 1;

      // When
      sessions.create(userId, undefined);

      // Then
      expect(countRows()).toBe(1);
    });

    it('should give every session its own token', () => {
      // When
      const first = sessions.create(userId, undefined);
      const second = sessions.create(userId, undefined);

      // Then
      expect(first.token).not.toBe(second.token);
      expect(countRows()).toBe(2);
    });
  });

  describe('resolve', () => {
    it('should resolve the user when the token is valid', () => {
      // Given
      const { token } = sessions.create(userId, 'Safari');

      // When
      const resolved = sessions.resolve(token);

      // Then
      expect(resolved?.user).toEqual({ id: userId, username: 'ash' });
    });

    it('should not resolve an unknown token', () => {
      // When
      const resolved = sessions.resolve('made-up-token');

      // Then
      expect(resolved).toBeNull();
    });

    it('should expire the session when the lifetime has passed', () => {
      // Given
      const { token, expiresAt } = sessions.create(userId, undefined);
      clock.now = expiresAt;

      // When
      const resolved = sessions.resolve(token);

      // Then
      expect(resolved).toBeNull();
    });

    it('should extend the expiry when the session is used after the slide interval', () => {
      // Given
      const { token } = sessions.create(userId, undefined);
      clock.now += 10 * DAY;

      // When
      const resolved = sessions.resolve(token);

      // Then
      expect(resolved?.renewedUntil).toBe(clock.now + TTL_DAYS * DAY);
      clock.now += 25 * DAY;
      expect(sessions.resolve(token)).not.toBeNull();
    });

    it('should not write again when the session is used again within the slide interval', () => {
      // Given
      const { token } = sessions.create(userId, undefined);
      clock.now += SLIDE_AFTER_MS - 1;

      // When
      const resolved = sessions.resolve(token);

      // Then
      expect(resolved?.renewedUntil).toBeNull();
    });

    it('should expire an unused session at the original time when it is never used', () => {
      // Given
      const { token } = sessions.create(userId, undefined);
      clock.now += TTL_DAYS * DAY + 1;

      // When
      const resolved = sessions.resolve(token);

      // Then
      expect(resolved).toBeNull();
    });
  });

  describe('revoke', () => {
    it('should not resolve the token when the session was revoked', () => {
      // Given
      const { token } = sessions.create(userId, undefined);

      // When
      sessions.revoke(token);

      // Then
      expect(sessions.resolve(token)).toBeNull();
    });
  });
});
