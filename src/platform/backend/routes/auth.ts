import { Router } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import type { AccountsService } from '../domain/accounts/index.ts';
import type { SessionService } from '../domain/auth/index.ts';
import { currentUser } from '../infrastructure/http/auth/currentUser.ts';
import type { SessionCookies } from '../infrastructure/http/auth/sessionCookie.ts';

const LOGIN_PATH = '/login';
const LOGOUT_PATH = '/logout';
const ME_PATH = '/me';
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_NO_CONTENT = 204;
const INVALID_REQUEST_RESPONSE = { error: 'Username and password are required' };
const INVALID_CREDENTIALS_RESPONSE = { error: 'Invalid username or password' };

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export interface AuthRoutesOptions {
  accounts: AccountsService;
  sessions: SessionService;
  cookies: SessionCookies;
  requireAuth: RequestHandler;
  loginRateLimit: RequestHandler;
}

export function authRoutes({
  accounts,
  sessions,
  cookies,
  requireAuth: authenticated,
  loginRateLimit: limitLogins,
}: AuthRoutesOptions): Router {
  const router = Router();

  router.post(LOGIN_PATH, limitLogins, async (req, res) => {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) {
      res.status(HTTP_BAD_REQUEST).json(INVALID_REQUEST_RESPONSE);
      return;
    }
    const account = await accounts.authenticate(body.data.username, body.data.password);
    if (!account) {
      res.status(HTTP_UNAUTHORIZED).json(INVALID_CREDENTIALS_RESPONSE);
      return;
    }
    const session = sessions.create(account.id, req.get('user-agent'));
    cookies.set(res, session.token, session.expiresAt);
    res.json({ user: { id: account.id, username: account.username } });
  });

  router.post(LOGOUT_PATH, (req, res) => {
    const token = cookies.read(req);
    if (token !== undefined) sessions.revoke(token);
    cookies.clear(res);
    res.status(HTTP_NO_CONTENT).end();
  });

  router.get(ME_PATH, authenticated, (req, res) => {
    res.json({ user: currentUser(req) });
  });

  return router;
}
