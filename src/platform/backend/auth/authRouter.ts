import { Router } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import type { AccountsService } from '../accounts/index.ts';
import { LOGIN_PATH, LOGOUT_PATH, ME_PATH } from '../constants.ts';
import { currentUser } from './currentUser.ts';
import { loginRateLimit } from './internal/loginRateLimit.ts';
import type { SessionCookies } from './sessionCookie.ts';
import type { SessionService } from './sessionService.ts';

const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_NO_CONTENT = 204;
const INVALID_REQUEST_RESPONSE = { error: 'Username and password are required' };
const INVALID_CREDENTIALS_RESPONSE = { error: 'Invalid username or password' };

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export interface AuthRouterOptions {
  accounts: AccountsService;
  sessions: SessionService;
  cookies: SessionCookies;
  requireAuth: RequestHandler;
}

export function authRouter({
  accounts,
  sessions,
  cookies,
  requireAuth: authenticated,
}: AuthRouterOptions): Router {
  const router = Router();

  router.post(LOGIN_PATH, loginRateLimit(), async (req, res) => {
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
