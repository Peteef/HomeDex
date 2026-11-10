import type { Storage } from '../../../infrastructure/storage/index.ts';

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

export const sessionRepository = (db: Storage): SessionRepository => {
  const insertSession = db.prepare(
    `INSERT INTO sessions (token_hash, user_id, created_at, last_seen_at, expires_at, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const selectActive = db.prepare(
    `SELECT sessions.user_id, users.username, sessions.last_seen_at
     FROM sessions JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ? AND sessions.expires_at > ? AND users.archived_at IS NULL`,
  );
  const updateExpiry = db.prepare(
    'UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE token_hash = ?',
  );
  const deleteByToken = db.prepare('DELETE FROM sessions WHERE token_hash = ?');
  const deleteByUser = db.prepare('DELETE FROM sessions WHERE user_id = ?');
  const deleteBefore = db.prepare('DELETE FROM sessions WHERE expires_at <= ?');

  const insert = (s: NewSession): void => {
    insertSession.run(s.tokenHash, s.userId, s.now, s.now, s.expiresAt, s.userAgent);
  };

  const findActive = (tokenHash: string, now: number): SessionUserRow | undefined =>
    selectActive.get(tokenHash, now) as SessionUserRow | undefined;

  const touch = (tokenHash: string, now: number, expiresAt: number): void => {
    updateExpiry.run(now, expiresAt, tokenHash);
  };

  const remove = (tokenHash: string): void => {
    deleteByToken.run(tokenHash);
  };

  const deleteForUser = (userId: number): void => {
    deleteByUser.run(userId);
  };

  const deleteExpired = (now: number): void => {
    deleteBefore.run(now);
  };

  return {
    insert,
    findActive,
    touch,
    delete: remove,
    deleteForUser,
    deleteExpired,
  };
};
