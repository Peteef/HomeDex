import type { CookieOptions, Request, Response } from 'express';

export const SESSION_COOKIE = 'hd_session';

export interface SessionCookies {
  read(req: Request): string | undefined;
  set(res: Response, token: string, expiresAt: number): void;
  clear(res: Response): void;
}

export const sessionCookies = (secure: boolean, now: () => number): SessionCookies => {
  const base: CookieOptions = { httpOnly: true, sameSite: 'lax', secure, path: '/' };
  const read = (req: Request): string | undefined => {
    const value: unknown = req.cookies[SESSION_COOKIE];
    return typeof value === 'string' && value !== '' ? value : undefined;
  };

  const set = (res: Response, token: string, expiresAt: number): void => {
    res.cookie(SESSION_COOKIE, token, { ...base, maxAge: expiresAt - now() });
  };

  const clear = (res: Response): void => {
    res.clearCookie(SESSION_COOKIE, base);
  };

  return {
    read,
    set,
    clear,
  };
};
