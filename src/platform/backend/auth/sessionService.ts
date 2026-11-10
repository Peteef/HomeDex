import { createHash, randomBytes } from 'node:crypto';
import type { Storage } from '../storage/db.ts';
import type { CurrentUser } from './currentUser.ts';
import { createSessionRepository } from './sessionRepository.ts';

const TOKEN_BYTES = 32;
const TOKEN_ENCODING = 'base64url';
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;
// Extending the expiry on every request would write to the database on every request.
export const SLIDE_AFTER_MS = MS_PER_HOUR;
const MAX_USER_AGENT_LENGTH = 256;

export interface SessionServiceOptions {
  ttlDays: number;
  now?: () => number;
}

export interface IssuedSession {
  token: string;
  expiresAt: number;
}

export interface ResolvedSession {
  user: CurrentUser;
  // Set when the expiry was just extended, so the cookie can be renewed too.
  renewedUntil: number | null;
}

export interface SessionService {
  create(userId: number, userAgent: string | undefined): IssuedSession;
  resolve(token: string): ResolvedSession | null;
  revoke(token: string): void;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createSessionService(
  db: Storage,
  { ttlDays, now = Date.now }: SessionServiceOptions,
): SessionService {
  const sessions = createSessionRepository(db);
  const ttlMs = ttlDays * MS_PER_DAY;

  return {
    create(userId, userAgent) {
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
      return { token, expiresAt };
    },

    resolve(token) {
      const tokenHash = hashToken(token);
      const current = now();
      const row = sessions.findActive(tokenHash, current);
      if (!row) return null;
      let renewedUntil: number | null = null;
      if (current - row.last_seen_at >= SLIDE_AFTER_MS) {
        renewedUntil = current + ttlMs;
        sessions.touch(tokenHash, current, renewedUntil);
      }
      return { user: { id: row.user_id, username: row.username }, renewedUntil };
    },

    revoke: (token) => {
      sessions.delete(hashToken(token));
    },
  };
}
