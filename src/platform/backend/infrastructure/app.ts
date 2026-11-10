import path from 'node:path';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import type { Argon2Params } from '../domain/accounts/index.ts';
import { domainServices } from '../domain/services.ts';
import { apiRoutes } from '../routes/index.ts';
import type { Config } from './config.ts';
import { API_PATH, MEDIA_PATH } from './constants.ts';
import { loginRateLimit } from './http/auth/loginRateLimit.ts';
import type { LoginLimit } from './http/auth/loginRateLimit.ts';
import { requireAuth } from './http/auth/requireAuth.ts';
import { sessionCookies } from './http/auth/sessionCookie.ts';
import { apiErrorHandler } from './http/errorHandler.ts';
import { requestGuard } from './http/requestGuard.ts';
import type { Storage } from './storage/index.ts';
import { NOT_FOUND } from './http/status.ts';

const INDEX_FILE = 'index.html';
const API_NOT_FOUND_RESPONSE = { error: 'Not found' };

export interface AppOptions {
  config: Config;
  storage: Storage;
  webDir: string;
  assetsDir: string;
  // Overrides for tests: a cheap password hash, a controllable clock and a small login limit.
  argon2Params?: Argon2Params;
  loginLimit?: LoginLimit;
  now?: () => number;
}

export const createApp = ({
  config,
  storage,
  webDir,
  assetsDir,
  argon2Params,
  loginLimit,
  now = Date.now,
}: AppOptions): express.Express => {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.TRUST_PROXY);
  // upgrade-insecure-requests and HSTS make Safari load everything over https, which breaks
  // plain-HTTP use on the LAN, so they follow the HTTPS setting.
  const https = config.COOKIE_SECURE;
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'upgrade-insecure-requests': https ? [] : null,
        },
      },
      strictTransportSecurity: https,
    }),
  );

  const { accounts, sessions } = domainServices(storage, {
    sessionTtlDays: config.SESSION_TTL_DAYS,
    now,
    ...(argon2Params && { argon2Params }),
  });
  const cookies = sessionCookies(https, now);
  app.use(
    API_PATH,
    cookieParser(),
    requestGuard,
    express.json(),
    apiRoutes({
      accounts,
      sessions,
      cookies,
      requireAuth: requireAuth(sessions, cookies),
      loginRateLimit: loginRateLimit(loginLimit),
    }),
  );
  // Without this, an unknown API path would reach the SPA fallback below and return HTML.
  app.use(API_PATH, (_req, res) => {
    res.status(NOT_FOUND).json(API_NOT_FOUND_RESPONSE);
  });
  app.use(API_PATH, apiErrorHandler);

  app.use(MEDIA_PATH, express.static(assetsDir, { fallthrough: false }));

  if (config.NODE_ENV === 'production') {
    app.use(express.static(webDir));
    app.use((_req, res) => {
      res.sendFile(path.join(webDir, INDEX_FILE));
    });
  }

  return app;
};
