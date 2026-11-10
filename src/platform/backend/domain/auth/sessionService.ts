import { createHash, randomBytes } from 'node:crypto';
import type { Storage } from '../../infrastructure/storage/index.ts';
import { sessionRepository } from './internal/sessionRepository.ts';
import type { IssuedSession, ResolvedSession } from './types.ts';

const TOKEN_BYTES = 32;
const TOKEN_ENCODING = 'base64url';
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;
// Extending the expiry on every request would write to the database on every request.
export const SLIDE_AFTER_MS = MS_PER_HOUR;
const MAX_USER_AGENT_LENGTH = 256;

interface SessionServiceOptions {
  ttlDays: number;
  now?: () => number;
}

export interface SessionService {
  create(userId: number, userAgent: string | undefined): IssuedSession;
  resolve(token: string): ResolvedSession | null;
  revoke(token: string): void;
  revokeAllFor(userId: number): void;
}

const hashToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};

const shouldSlide = (lastSeenAt: number, current: number): boolean =>
  current - lastSeenAt >= SLIDE_AFTER_MS;

export const sessionService = (
  db: Storage,
  { ttlDays, now = Date.now }: SessionServiceOptions,
): SessionService => {
  const sessions = sessionRepository(db);
  const ttlMs = ttlDays * MS_PER_DAY;

  const create = (userId: number, userAgent: string | undefined): IssuedSession => {
    const current = now();
    sessions.deleteExpired(current);
    const token = randomBytes(TOKEN_BYTES).toString(TOKEN_ENCODING);
    const expiresAt = current + ttlMs;
    sessions.insert({
      tokenHash: hashToken(token),
      userId,
      now: current,
      expiresAt,
      userAgent: userAgent?.slice(0, MAX_USER_AGENT_LENGTH) ?? null,
    });
    return {
      token,
      expiresAt,
    };
  };

  const resolve = (token: string): ResolvedSession | null => {
    const tokenHash = hashToken(token);
    const current = now();
    const row = sessions.findActive(tokenHash, current);
    if (!row) {
      return null;
    }
    const renewedUntil = shouldSlide(row.last_seen_at, current) ? current + ttlMs : null;
    if (renewedUntil !== null) {
      sessions.touch(tokenHash, current, renewedUntil);
    }
    return {
      user: { id: row.user_id, username: row.username },
      renewedUntil,
    };
  };

  const revoke = (token: string): void => {
    sessions.delete(hashToken(token));
  };

  const revokeAllFor = (userId: number): void => {
    sessions.deleteForUser(userId);
  };

  return {
    create,
    resolve,
    revoke,
    revokeAllFor,
  };
};
