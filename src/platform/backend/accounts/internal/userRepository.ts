import type { Storage } from '../../storage/index.ts';

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

export function userRepository(db: Storage): UserRepository {
  const insert = db.prepare(
    'INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?) RETURNING *',
  );
  const findByUsername = db.prepare('SELECT * FROM users WHERE username = ?');
  const listActive = db.prepare('SELECT * FROM users WHERE archived_at IS NULL ORDER BY username');
  const listAll = db.prepare('SELECT * FROM users ORDER BY username');
  const updateUsername = db.prepare('UPDATE users SET username = ? WHERE id = ?');
  const updatePasswordHash = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
  const setArchivedAt = db.prepare('UPDATE users SET archived_at = ? WHERE id = ?');

  return {
    insert: (username, passwordHash, createdAt) =>
      insert.get(username, passwordHash, createdAt) as UserRow,
    findByUsername: (username) => findByUsername.get(username) as UserRow | undefined,
    list: (includeArchived) => (includeArchived ? listAll : listActive).all() as UserRow[],
    updateUsername: (id, username) => void updateUsername.run(username, id),
    updatePasswordHash: (id, passwordHash) => void updatePasswordHash.run(passwordHash, id),
    setArchivedAt: (id, archivedAt) => void setArchivedAt.run(archivedAt, id),
  };
}
