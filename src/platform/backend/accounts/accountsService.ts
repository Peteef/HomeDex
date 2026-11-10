import type { z } from 'zod';
import type { Storage } from '../storage/index.ts';
import { AccountError } from './errors.ts';
import { DEFAULT_SCRYPT_PARAMS, hashPassword, verifyPassword } from './internal/password.ts';
import type { ScryptParams } from './internal/password.ts';
import type { Account, AccountEdit } from './types.ts';
import { userRepository } from './internal/userRepository.ts';
import type { UserRow } from './internal/userRepository.ts';
import {
  MAX_PASSWORD_LENGTH,
  MAX_USERNAME_LENGTH,
  passwordSchema,
  usernameSchema,
} from './internal/validation.ts';

const DUMMY_PASSWORD = 'timing-equalizer';

interface AccountsOptions {
  // Called when an account loses access: archived, or its password changed.
  revokeSessions: (userId: number) => void;
  scryptParams?: ScryptParams;
  now?: () => number;
}

export interface AccountsService {
  create(username: string, password: string): Promise<Account>;
  list(options?: { includeArchived?: boolean }): Account[];
  edit(username: string, changes: AccountEdit): Promise<Account>;
  archive(username: string): Account;
  restore(username: string): Account;
  authenticate(username: string, password: string): Promise<Account | null>;
}

function toAccount(row: UserRow): Account {
  return {
    id: row.id,
    username: row.username,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
  };
}

function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AccountError('invalid', result.error.issues[0]?.message ?? 'Invalid value');
  }
  return result.data;
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'SQLITE_CONSTRAINT_UNIQUE';
}

export function accountsService(
  db: Storage,
  { revokeSessions, scryptParams = DEFAULT_SCRYPT_PARAMS, now = Date.now }: AccountsOptions,
): AccountsService {
  const users = userRepository(db);
  let dummyHash: Promise<string> | undefined;

  function requireUser(username: string): UserRow {
    const user = users.findByUsername(username);
    if (!user) throw new AccountError('not_found', `No user named "${username}"`);
    return user;
  }

  return {
    async create(username, password) {
      const validUsername = validate(usernameSchema, username);
      const validPassword = validate(passwordSchema, password);
      const passwordHash = await hashPassword(validPassword, scryptParams);
      try {
        return toAccount(users.insert(validUsername, passwordHash, now()));
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new AccountError('taken', `Username "${validUsername}" is already taken`);
        }
        throw error;
      }
    },

    list: ({ includeArchived = false } = {}) => users.list(includeArchived).map(toAccount),

    async edit(username, changes) {
      const user = requireUser(username);
      if (user.archived_at !== null) {
        throw new AccountError('archived', `User "${user.username}" is archived`);
      }
      const newUsername =
        changes.username === undefined ? undefined : validate(usernameSchema, changes.username);
      const newHash =
        changes.password === undefined
          ? undefined
          : await hashPassword(validate(passwordSchema, changes.password), scryptParams);
      try {
        db.transaction(() => {
          if (newUsername !== undefined) users.updateUsername(user.id, newUsername);
          if (newHash !== undefined) {
            users.updatePasswordHash(user.id, newHash);
            revokeSessions(user.id);
          }
        })();
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new AccountError('taken', `Username "${newUsername ?? ''}" is already taken`);
        }
        throw error;
      }
      return toAccount(requireUser(newUsername ?? user.username));
    },

    archive(username) {
      const user = requireUser(username);
      db.transaction(() => {
        users.setArchivedAt(user.id, now());
        revokeSessions(user.id);
      })();
      return toAccount(requireUser(user.username));
    },

    restore(username) {
      const user = requireUser(username);
      users.setArchivedAt(user.id, null);
      return toAccount(requireUser(user.username));
    },

    async authenticate(username, password) {
      if (username.length > MAX_USERNAME_LENGTH || password.length > MAX_PASSWORD_LENGTH)
        return null;
      const user = users.findByUsername(username);
      // An unknown user still costs one hash check, so timing does not reveal which names exist.
      dummyHash ??= hashPassword(DUMMY_PASSWORD, scryptParams);
      const valid = await verifyPassword(password, user?.password_hash ?? (await dummyHash));
      if (!user || !valid || user.archived_at !== null) return null;
      return toAccount(user);
    },
  };
}
