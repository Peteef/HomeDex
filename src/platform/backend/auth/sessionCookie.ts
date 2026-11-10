import type { CookieOptions, Request, Response } from 'express';

export const SESSION_COOKIE = 'hd_session';

export interface SessionCookies {
  read(req: Request): string | undefined;
  set(res: Response, token: string, expiresAt: number): void;
  clear(res: Response): void;
}

export function sessionCookies(secure: boolean, now: () => number): SessionCookies {
  const base: CookieOptions = { httpOnly: true, sameSite: 'lax', secure, path: '/' };
  return {
    read(req) {
      const value: unknown = req.cookies[SESSION_COOKIE];
      return typeof value === 'string' && value !== '' ? value : undefined;
    },
    set(res, token, expiresAt) {
      res.cookie(SESSION_COOKIE, token, { ...base, maxAge: expiresAt - now() });
    },
    clear(res) {
      res.clearCookie(SESSION_COOKIE, base);
    },
  };
}
