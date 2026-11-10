import type Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTestDatabase, createTestUser } from '../../__tests__/helpers.ts';
import { createSessionService, SLIDE_AFTER_MS } from '../sessionService.ts';
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
    sessions = createSessionService(db, { ttlDays: TTL_DAYS, now: () => clock.now });
    await createTestUser(db, 'ash');
    userId = (db.prepare('SELECT id FROM users').get() as { id: number }).id;
  });

  it('should resolve the user when the token is valid', () => {
    const { token } = sessions.create(userId, 'Safari');
    expect(sessions.resolve(token)?.user).toEqual({ id: userId, username: 'ash' });
  });

  it('should store only a hash of the token', () => {
    const { token } = sessions.create(userId, undefined);
    const row = db.prepare('SELECT token_hash FROM sessions').get() as { token_hash: string };
    expect(row.token_hash).not.toBe(token);
    expect(row.token_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should not resolve an unknown token', () => {
    expect(sessions.resolve('made-up-token')).toBeNull();
  });

  it('should expire the session when the lifetime has passed', () => {
    const { token, expiresAt } = sessions.create(userId, undefined);
    expect(expiresAt).toBe(clock.now + TTL_DAYS * DAY);
    clock.now = expiresAt;
    expect(sessions.resolve(token)).toBeNull();
  });

  it('should extend the expiry when the session is used after the slide interval', () => {
    const { token } = sessions.create(userId, undefined);
    clock.now += 10 * DAY;
    const resolved = sessions.resolve(token);
    expect(resolved?.renewedUntil).toBe(clock.now + TTL_DAYS * DAY);
    clock.now += 25 * DAY;
    expect(sessions.resolve(token)).not.toBeNull();
  });

  it('should not write again when the session is used again within the slide interval', () => {
    const { token } = sessions.create(userId, undefined);
    clock.now += SLIDE_AFTER_MS - 1;
    expect(sessions.resolve(token)?.renewedUntil).toBeNull();
  });

  it('should expire an unused session at the original time when it is never used', () => {
    const { token } = sessions.create(userId, undefined);
    clock.now += TTL_DAYS * DAY + 1;
    expect(sessions.resolve(token)).toBeNull();
  });

  it('should not resolve the token when the session was revoked', () => {
    const { token } = sessions.create(userId, undefined);
    sessions.revoke(token);
    expect(sessions.resolve(token)).toBeNull();
  });

  it('should purge expired sessions when a new session is created', () => {
    sessions.create(userId, undefined);
    clock.now += TTL_DAYS * DAY + 1;
    sessions.create(userId, undefined);
    expect(countRows()).toBe(1);
  });

  it('should give every session its own token', () => {
    const first = sessions.create(userId, undefined);
    const second = sessions.create(userId, undefined);
    expect(first.token).not.toBe(second.token);
    expect(countRows()).toBe(2);
  });
});
