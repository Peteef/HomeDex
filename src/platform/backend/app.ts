import path from 'node:path';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import type { ScryptParams } from './accounts/index.ts';
import { authRouter, requireAuth, sessionCookies } from './auth/index.ts';
import type { Config } from './config.ts';
import { API_PATH, AUTH_PATH, HEALTH_PATH, MEDIA_PATH } from './constants.ts';
import { apiErrorHandler } from './http/errorHandler.ts';
import { requestGuard } from './http/requestGuard.ts';
import { services } from './services.ts';
import type { Storage } from './storage/index.ts';

const INDEX_FILE = 'index.html';
const HEALTH_RESPONSE = { status: 'ok' };
const API_NOT_FOUND_RESPONSE = { error: 'Not found' };
const HTTP_NOT_FOUND = 404;

export interface AppOptions {
  config: Config;
  storage: Storage;
  webDir: string;
  assetsDir: string;
  // Overrides for tests: a cheap password hash and a controllable clock.
  scryptParams?: ScryptParams;
  now?: () => number;
}

export function createApp({
  config,
  storage,
  webDir,
  assetsDir,
  scryptParams,
  now = Date.now,
}: AppOptions): express.Express {
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

  app.get(HEALTH_PATH, (_req, res) => {
    res.json(HEALTH_RESPONSE);
  });
  const { accounts, sessions } = services(storage, config, {
    now,
    ...(scryptParams && { scryptParams }),
  });
  const cookies = sessionCookies(https, now);
  app.use(API_PATH, cookieParser(), requestGuard, express.json());
  app.use(
    AUTH_PATH,
    authRouter({ accounts, sessions, cookies, requireAuth: requireAuth(sessions, cookies) }),
  );
  // Without this, an unknown API path would reach the SPA fallback below and return HTML.
  app.use(API_PATH, (_req, res) => {
    res.status(HTTP_NOT_FOUND).json(API_NOT_FOUND_RESPONSE);
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
}
