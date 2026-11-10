import type { RequestHandler } from 'express';
import { setCurrentUser } from './currentUser.ts';
import type { SessionCookies } from './sessionCookie.ts';
import type { SessionService } from '../../../domain/auth/index.ts';

const HTTP_UNAUTHORIZED = 401;
export const NOT_AUTHENTICATED_RESPONSE = { error: 'Not authenticated' };

export function requireAuth(sessions: SessionService, cookies: SessionCookies): RequestHandler {
  return (req, res, next) => {
    const token = cookies.read(req);
    const session = token === undefined ? null : sessions.resolve(token);
    if (token === undefined || !session) {
      res.status(HTTP_UNAUTHORIZED).json(NOT_AUTHENTICATED_RESPONSE);
      return;
    }
    if (session.renewedUntil !== null) cookies.set(res, token, session.renewedUntil);
    setCurrentUser(req, session.user);
    next();
  };
}
