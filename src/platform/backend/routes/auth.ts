import { Router } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import type { AccountsService } from '../domain/accounts/index.ts';
import type { SessionService } from '../domain/auth/index.ts';
import { currentUser } from '../infrastructure/http/auth/currentUser.ts';
import type { SessionCookies } from '../infrastructure/http/auth/sessionCookie.ts';
import { BAD_REQUEST, NO_CONTENT, UNAUTHORIZED } from '../../shared/http/status.ts';

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

export const authRoutes = ({
  accounts,
  sessions,
  cookies,
  requireAuth: authenticated,
  loginRateLimit: limitLogins,
}: AuthRoutesOptions): Router => {
  const router = Router();

  router.post('/login', limitLogins, async (req, res) => {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) {
      res.status(BAD_REQUEST).json(INVALID_REQUEST_RESPONSE);
      return;
    }
    const account = await accounts.authenticate(body.data.username, body.data.password);
    if (!account) {
      res.status(UNAUTHORIZED).json(INVALID_CREDENTIALS_RESPONSE);
      return;
    }
    const session = sessions.create(account.id, req.get('user-agent'));
    cookies.set(res, session.token, session.expiresAt);
    res.json({ user: { id: account.id, username: account.username } });
  });

  router.post('/logout', (req, res) => {
    const token = cookies.read(req);
    if (token !== undefined) {
      sessions.revoke(token);
    }
    cookies.clear(res);
    res.status(NO_CONTENT).end();
  });

  router.get('/me', authenticated, (req, res) => {
    res.json({ user: currentUser(req) });
  });

  return router;
};
