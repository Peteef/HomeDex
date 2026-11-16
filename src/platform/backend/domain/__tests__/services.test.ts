import type Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createTestDatabase,
  FAST_ARGON2,
  TEST_PASSWORD,
} from '../../infrastructure/__tests__/helpers.ts';
import { domainServices } from '../services.ts';

const SESSION_TTL_DAYS = 365;

describe('domainServices', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDatabase();
  });

  const sessionCount = (): number =>
    (db.prepare('SELECT COUNT(*) AS n FROM sessions').get() as { n: number }).n;

  it('should sign the user out everywhere when the password changes', async () => {
    // Given
    const { accounts, sessions } = domainServices(db, {
      sessionTtlDays: SESSION_TTL_DAYS,
      argon2Params: FAST_ARGON2,
    });

    const account = await accounts.create('ash', TEST_PASSWORD);
    const { token } = sessions.create(account.id, undefined);

    // When
    await accounts.edit('ash', { password: 'another-secret-pass' });

    // Then
    expect(sessions.resolve(token)).toBeNull();
    expect(sessionCount()).toBe(0);
  });

  it('should sign the user out everywhere when the account is archived', async () => {
    // Given
    const { accounts, sessions } = domainServices(db, {
      sessionTtlDays: SESSION_TTL_DAYS,
      argon2Params: FAST_ARGON2,
    });

    const account = await accounts.create('ash', TEST_PASSWORD);
    const { token } = sessions.create(account.id, undefined);

    // When
    accounts.archive('ash');

    // Then
    expect(sessions.resolve(token)).toBeNull();
    expect(sessionCount()).toBe(0);
  });

  it('should hide a module tile when no module ids are passed', async () => {
    // Given
    const { accounts, tiles } = domainServices(db, {
      sessionTtlDays: SESSION_TTL_DAYS,
      argon2Params: FAST_ARGON2,
    });

    const account = await accounts.create('ash', TEST_PASSWORD);
    tiles.syncModuleTiles([{ moduleId: 'notes', icon: 'notes' }]);

    // When
    const list = tiles.list(account.id);

    // Then
    expect(list).toEqual([]);
  });

  it('should show a module tile when its module id is enabled', async () => {
    // Given
    const { accounts, tiles } = domainServices(db, {
      sessionTtlDays: SESSION_TTL_DAYS,
      argon2Params: FAST_ARGON2,
      enabledModuleIds: ['notes'],
    });

    const account = await accounts.create('ash', TEST_PASSWORD);
    tiles.syncModuleTiles([{ moduleId: 'notes', icon: 'notes' }]);

    // When
    const list = tiles.list(account.id);

    // Then
    expect(list.map((tile) => tile.moduleId)).toEqual(['notes']);
  });

  it('should give the accounts, sessions and tiles the same clock when now is passed', async () => {
    // Given
    const { accounts, sessions, tiles } = domainServices(db, {
      sessionTtlDays: 1,
      argon2Params: FAST_ARGON2,
      now: () => 5_000,
    });

    // When
    const account = await accounts.create('ash', TEST_PASSWORD);
    const session = sessions.create(account.id, undefined);
    tiles.syncModuleTiles([{ moduleId: 'notes', icon: 'notes' }]);

    // Then
    expect(account.createdAt).toBe(5_000);
    expect(session.expiresAt).toBe(86_405_000);
    expect(db.prepare('SELECT created_at FROM tiles').get()).toEqual({ created_at: 5_000 });
  });
});
