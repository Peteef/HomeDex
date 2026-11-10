import type { Storage } from '../../../infrastructure/storage/index.ts';
import { AccountError } from '../errors.ts';

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  created_at: number;
  archived_at: number | null;
}

export interface UserRepository {
  insert(username: string, passwordHash: string, createdAt: number): UserRow;
  findByUsername(username: string): UserRow | undefined;
  list(includeArchived: boolean): UserRow[];
  updateUsername(id: number, username: string): void;
  updatePasswordHash(id: number, passwordHash: string): void;
  setArchivedAt(id: number, archivedAt: number | null): void;
}

const isUniqueViolation = (error: unknown): boolean => {
  return error instanceof Error && 'code' in error && error.code === 'SQLITE_CONSTRAINT_UNIQUE';
};

// The repository knows how the database reports a taken name, so it translates it.
const failIfTaken = <T>(username: string, write: () => T): T => {
  try {
    return write();
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AccountError('taken', `Username "${username}" is already taken`);
    }
    throw error;
  }
};

export const userRepository = (db: Storage): UserRepository => {
  const insertUser = db.prepare(
    'INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?) RETURNING *',
  );
  const selectByUsername = db.prepare('SELECT * FROM users WHERE username = ?');
  const selectActive = db.prepare(
    'SELECT * FROM users WHERE archived_at IS NULL ORDER BY username',
  );
  const selectAll = db.prepare('SELECT * FROM users ORDER BY username');
  const renameUser = db.prepare('UPDATE users SET username = ? WHERE id = ?');
  const replacePasswordHash = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
  const replaceArchivedAt = db.prepare('UPDATE users SET archived_at = ? WHERE id = ?');

  const insert = (username: string, passwordHash: string, createdAt: number): UserRow => {
    return failIfTaken(
      username,
      () => insertUser.get(username, passwordHash, createdAt) as UserRow,
    );
  };

  const findByUsername = (username: string): UserRow | undefined => {
    return selectByUsername.get(username) as UserRow | undefined;
  };

  const list = (includeArchived: boolean): UserRow[] => {
    return (includeArchived ? selectAll : selectActive).all() as UserRow[];
  };

  const updateUsername = (id: number, username: string): void => {
    failIfTaken(username, () => renameUser.run(username, id));
  };

  const updatePasswordHash = (id: number, passwordHash: string): void => {
    replacePasswordHash.run(passwordHash, id);
  };

  const setArchivedAt = (id: number, archivedAt: number | null): void => {
    replaceArchivedAt.run(archivedAt, id);
  };

  return {
    insert,
    findByUsername,
    list,
    updateUsername,
    updatePasswordHash,
    setArchivedAt,
  };
};
