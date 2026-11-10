import type { Storage } from '../../storage/index.ts';

export interface SessionUserRow {
  user_id: number;
  username: string;
  last_seen_at: number;
}

export interface NewSession {
  tokenHash: string;
  userId: number;
  now: number;
  expiresAt: number;
  userAgent: string | null;
}

export interface SessionRepository {
  insert(session: NewSession): void;
  findActive(tokenHash: string, now: number): SessionUserRow | undefined;
  touch(tokenHash: string, now: number, expiresAt: number): void;
  delete(tokenHash: string): void;
  deleteForUser(userId: number): void;
  deleteExpired(now: number): void;
}

export function sessionRepository(db: Storage): SessionRepository {
  const insert = db.prepare(
    `INSERT INTO sessions (token_hash, user_id, created_at, last_seen_at, expires_at, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const findActive = db.prepare(
    `SELECT sessions.user_id, users.username, sessions.last_seen_at
     FROM sessions JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ? AND sessions.expires_at > ? AND users.archived_at IS NULL`,
  );
  const touch = db.prepare(
    'UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE token_hash = ?',
  );
  const remove = db.prepare('DELETE FROM sessions WHERE token_hash = ?');
  const removeForUser = db.prepare('DELETE FROM sessions WHERE user_id = ?');
  const removeExpired = db.prepare('DELETE FROM sessions WHERE expires_at <= ?');

  return {
    insert: (s) => void insert.run(s.tokenHash, s.userId, s.now, s.now, s.expiresAt, s.userAgent),
    findActive: (tokenHash, now) => findActive.get(tokenHash, now) as SessionUserRow | undefined,
    touch: (tokenHash, now, expiresAt) => void touch.run(now, expiresAt, tokenHash),
    delete: (tokenHash) => void remove.run(tokenHash),
    deleteForUser: (userId) => void removeForUser.run(userId),
    deleteExpired: (now) => void removeExpired.run(now),
  };
}
