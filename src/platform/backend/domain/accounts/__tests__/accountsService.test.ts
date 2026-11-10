import type Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { sessionService } from '../../auth/index.ts';
import type { SessionService } from '../../auth/index.ts';
import {
  createTestDatabase,
  FAST_ARGON2,
  TEST_PASSWORD,
} from '../../../infrastructure/__tests__/helpers.ts';
import { accountsService } from '../accountsService.ts';
import type { AccountsService } from '../accountsService.ts';
import { AccountError } from '../errors.ts';

const codeOf = async (promise: Promise<unknown> | (() => unknown)): Promise<string | undefined> => {
  try {
    await (typeof promise === 'function' ? promise() : promise);
  } catch (error) {
    return error instanceof AccountError ? error.code : 'other';
  }
  return undefined;
};

describe('accounts service', () => {
  let db: Database.Database;
  let accounts: AccountsService;
  let sessions: SessionService;

  beforeEach(() => {
    db = createTestDatabase();
    sessions = sessionService(db, { ttlDays: 1 });
    accounts = accountsService(db, {
      argon2Params: FAST_ARGON2,
      revokeSessions: (userId) => {
        sessions.revokeAllFor(userId);
      },
    });
  });

  describe('create', () => {
    it('should create an account that can authenticate', async () => {
      // When
      await accounts.create('Ash', TEST_PASSWORD);

      // Then
      expect((await accounts.authenticate('Ash', TEST_PASSWORD))?.username).toBe('Ash');
    });

    it('should store a hash, never the password', async () => {
      // When
      await accounts.create('ash', TEST_PASSWORD);

      // Then
      const row = db.prepare('SELECT password_hash FROM users').get() as { password_hash: string };
      expect(row.password_hash).not.toContain(TEST_PASSWORD);
      expect(row.password_hash.startsWith('$argon2id$')).toBe(true);
    });

    it('should reject the username when it is already taken regardless of case', async () => {
      // Given
      await accounts.create('ash', TEST_PASSWORD);

      // When / Then
      expect(await codeOf(accounts.create('ASH', TEST_PASSWORD))).toBe('taken');
    });

    it('should keep the username reserved when the account is archived', async () => {
      // Given
      await accounts.create('ash', TEST_PASSWORD);
      accounts.archive('ash');

      // When / Then
      expect(await codeOf(accounts.create('ash', TEST_PASSWORD))).toBe('taken');
    });

    it('should reject a password shorter than 8 characters', async () => {
      // When / Then
      expect(await codeOf(accounts.create('ash', '1234567'))).toBe('invalid');
      expect(await codeOf(accounts.create('ash', '12345678'))).toBeUndefined();
    });

    it('should reject a username with unsupported characters', async () => {
      // When / Then
      expect(await codeOf(accounts.create('a b', TEST_PASSWORD))).toBe('invalid');
      expect(await codeOf(accounts.create('', TEST_PASSWORD))).toBe('invalid');
      expect(await codeOf(accounts.create('x'.repeat(33), TEST_PASSWORD))).toBe('invalid');
    });
  });

  describe('authenticate', () => {
    beforeEach(async () => {
      await accounts.create('Ash', TEST_PASSWORD);
    });

    it('should ignore the case of the username', async () => {
      // When
      const account = await accounts.authenticate('aSH', TEST_PASSWORD);

      // Then
      expect(account).not.toBeNull();
    });

    it('should reject the login when the password is wrong', async () => {
      // When
      const account = await accounts.authenticate('ash', 'wrong-password');

      // Then
      expect(account).toBeNull();
    });

    it('should reject the login when the user does not exist', async () => {
      // When
      const account = await accounts.authenticate('nobody', TEST_PASSWORD);

      // Then
      expect(account).toBeNull();
    });

    it('should reject the login without hashing when the input is longer than the limits', async () => {
      // When / Then
      expect(await accounts.authenticate('ash', 'x'.repeat(129))).toBeNull();
      expect(await accounts.authenticate('a'.repeat(33), TEST_PASSWORD)).toBeNull();
    });
  });

  describe('list', () => {
    it('should list active accounts by name and archived ones only on request', async () => {
      // Given
      await accounts.create('misty', TEST_PASSWORD);
      await accounts.create('ash', TEST_PASSWORD);
      accounts.archive('misty');

      // When
      const active = accounts.list();
      const all = accounts.list({ includeArchived: true });

      // Then
      expect(active.map((a) => a.username)).toEqual(['ash']);
      expect(all.map((a) => a.username)).toEqual(['ash', 'misty']);
    });
  });

  describe('edit', () => {
    it('should change the username and keep the password', async () => {
      // Given
      await accounts.create('ash', TEST_PASSWORD);

      // When
      await accounts.edit('ash', { username: 'ash-ketchum' });

      // Then
      expect(await accounts.authenticate('ash-ketchum', TEST_PASSWORD)).not.toBeNull();
      expect(await accounts.authenticate('ash', TEST_PASSWORD)).toBeNull();
    });

    it('should change the username and the password together', async () => {
      // Given
      await accounts.create('ash', TEST_PASSWORD);

      // When
      await accounts.edit('ash', { username: 'ash2', password: 'brand-new-password' });

      // Then
      expect(await accounts.authenticate('ash2', 'brand-new-password')).not.toBeNull();
      expect(await accounts.authenticate('ash2', TEST_PASSWORD)).toBeNull();
      expect(await accounts.authenticate('ash', 'brand-new-password')).toBeNull();
    });

    it('should leave everything unchanged when the new username is taken and the password changes too', async () => {
      // Given
      await accounts.create('ash', TEST_PASSWORD);
      await accounts.create('misty', TEST_PASSWORD);

      // When
      const code = await codeOf(
        accounts.edit('ash', { username: 'misty', password: 'brand-new-password' }),
      );

      // Then
      expect(code).toBe('taken');
      expect(await accounts.authenticate('ash', TEST_PASSWORD)).not.toBeNull();
    });

    it('should change the password and sign the user out of every device', async () => {
      // Given
      const user = await accounts.create('ash', TEST_PASSWORD);
      const other = await accounts.create('misty', TEST_PASSWORD);
      const ashSession = sessions.create(user.id, undefined);
      const mistySession = sessions.create(other.id, undefined);

      // When
      await accounts.edit('ash', { password: 'brand-new-password' });

      // Then
      expect(await accounts.authenticate('ash', TEST_PASSWORD)).toBeNull();
      expect(await accounts.authenticate('ash', 'brand-new-password')).not.toBeNull();
      expect(sessions.resolve(ashSession.token)).toBeNull();
      expect(sessions.resolve(mistySession.token)).not.toBeNull();
    });

    it('should keep the sessions when only the username changes', async () => {
      // Given
      const user = await accounts.create('ash', TEST_PASSWORD);
      const session = sessions.create(user.id, undefined);

      // When
      await accounts.edit('ash', { username: 'ash2' });

      // Then
      expect(sessions.resolve(session.token)?.user.username).toBe('ash2');
    });

    it('should reject a username that another user has', async () => {
      // Given
      await accounts.create('ash', TEST_PASSWORD);
      await accounts.create('misty', TEST_PASSWORD);

      // When / Then
      expect(await codeOf(accounts.edit('ash', { username: 'Misty' }))).toBe('taken');
    });

    it('should reject the edit when the user does not exist or is archived', async () => {
      // Given
      await accounts.create('ash', TEST_PASSWORD);
      accounts.archive('ash');

      // When / Then
      expect(await codeOf(accounts.edit('nobody', { username: 'x' }))).toBe('not_found');
      expect(await codeOf(accounts.edit('ash', { username: 'x' }))).toBe('archived');
    });
  });

  describe('archive', () => {
    it('should block the login and revoke the sessions', async () => {
      // Given
      const user = await accounts.create('ash', TEST_PASSWORD);
      const session = sessions.create(user.id, undefined);

      // When
      accounts.archive('ash');

      // Then
      expect(await accounts.authenticate('ash', TEST_PASSWORD)).toBeNull();
      expect(sessions.resolve(session.token)).toBeNull();
    });

    it('should report an unknown user when the name is missing', async () => {
      // When / Then
      expect(await codeOf(() => accounts.archive('nobody'))).toBe('not_found');
    });
  });

  describe('restore', () => {
    it('should allow the login again', async () => {
      // Given
      await accounts.create('ash', TEST_PASSWORD);
      accounts.archive('ash');

      // When
      accounts.restore('ash');

      // Then
      expect(await accounts.authenticate('ash', TEST_PASSWORD)).not.toBeNull();
    });

    it('should report an unknown user when the name is missing', async () => {
      // When / Then
      expect(await codeOf(() => accounts.restore('nobody'))).toBe('not_found');
    });
  });
});
