import type { Storage } from '../../infrastructure/storage/index.ts';
import { AccountError } from './errors.ts';
import { lazy } from './internal/lazy.ts';
import { DEFAULT_ARGON2_PARAMS, hashPassword, verifyPassword } from './internal/password.ts';
import type { Argon2Params } from './internal/password.ts';
import { toAccount } from './internal/toAccount.ts';
import { userRepository } from './internal/userRepository.ts';
import type { UserRow } from './internal/userRepository.ts';
import {
  MAX_PASSWORD_LENGTH,
  MAX_USERNAME_LENGTH,
  passwordSchema,
  usernameSchema,
  validate,
} from './internal/validation.ts';
import type { Account, AccountEdit } from './types.ts';

const DUMMY_PASSWORD = 'timing-equalizer';

interface AccountsOptions {
  // Called when an account loses access: archived, or its password changed.
  revokeSessions: (userId: number) => void;
  argon2Params?: Argon2Params;
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

// A validated edit, ready to be written.
interface AccountUpdate {
  username?: string;
  passwordHash?: string;
}

const isWithinLimits = (username: string, password: string): boolean =>
  username.length <= MAX_USERNAME_LENGTH && password.length <= MAX_PASSWORD_LENGTH;

export const accountsService = (
  db: Storage,
  { revokeSessions, argon2Params = DEFAULT_ARGON2_PARAMS, now = Date.now }: AccountsOptions,
): AccountsService => {
  const users = userRepository(db);
  const dummyHash = lazy(() => hashPassword(DUMMY_PASSWORD, argon2Params));

  const requireUser = (username: string): UserRow => {
    const user = users.findByUsername(username);

    if (!user) {
      throw new AccountError('not_found', `No user named "${username}"`);
    }

    return user;
  };

  const requireActiveUser = (username: string): UserRow => {
    const user = requireUser(username);

    if (user.archived_at !== null) {
      throw new AccountError('archived', `User "${user.username}" is archived`);
    }

    return user;
  };

  const hashValidPassword = async (password: string): Promise<string> =>
    hashPassword(validate(passwordSchema, password), argon2Params);

  const prepareUpdate = async (changes: AccountEdit): Promise<AccountUpdate> => ({
    ...(changes.username !== undefined && {
      username: validate(usernameSchema, changes.username),
    }),
    ...(changes.password !== undefined && {
      passwordHash: await hashValidPassword(changes.password),
    }),
  });

  const applyUpdate = (user: UserRow, update: AccountUpdate): void => {
    db.transaction(() => {
      if (update.username !== undefined) {
        users.updateUsername(user.id, update.username);
      }

      if (update.passwordHash !== undefined) {
        users.updatePasswordHash(user.id, update.passwordHash);
        revokeSessions(user.id);
      }
    })();
  };

  const create = async (username: string, password: string): Promise<Account> => {
    const validUsername = validate(usernameSchema, username);
    const passwordHash = await hashValidPassword(password);
    return toAccount(users.insert(validUsername, passwordHash, now()));
  };

  const list = ({ includeArchived = false }: { includeArchived?: boolean } = {}): Account[] =>
    users.list(includeArchived).map(toAccount);

  const edit = async (username: string, changes: AccountEdit): Promise<Account> => {
    const user = requireActiveUser(username);
    const update = await prepareUpdate(changes);
    applyUpdate(user, update);
    return toAccount(requireUser(update.username ?? user.username));
  };

  const archive = (username: string): Account => {
    const user = requireUser(username);

    db.transaction(() => {
      users.setArchivedAt(user.id, now());
      revokeSessions(user.id);
    })();

    return toAccount(requireUser(user.username));
  };

  const restore = (username: string): Account => {
    const user = requireUser(username);
    users.setArchivedAt(user.id, null);
    return toAccount(requireUser(user.username));
  };

  const authenticate = async (username: string, password: string): Promise<Account | null> => {
    if (!isWithinLimits(username, password)) {
      return null;
    }

    const user = users.findByUsername(username);
    // An unknown user still costs one hash check, so timing does not reveal which names exist.
    const valid = await verifyPassword(password, user?.password_hash ?? (await dummyHash()));
    return user && valid && user.archived_at === null ? toAccount(user) : null;
  };

  return {
    create,
    list,
    edit,
    archive,
    restore,
    authenticate,
  };
};
