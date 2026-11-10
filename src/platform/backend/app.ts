import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import type { Config } from './config.ts';
import { API_PATH, HEALTH_PATH, MEDIA_PATH } from './constants.ts';

const INDEX_FILE = 'index.html';
const HEALTH_RESPONSE = { status: 'ok' };
const API_NOT_FOUND_RESPONSE = { error: 'Not found' };
const HTTP_NOT_FOUND = 404;

export interface AppOptions {
  config: Config;
  webDir: string;
  assetsDir: string;
}

export function createApp({ config, webDir, assetsDir }: AppOptions): express.Express {
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
  // Without this, an unknown API path would reach the SPA fallback below and return HTML.
  app.use(API_PATH, (_req, res) => {
    res.status(HTTP_NOT_FOUND).json(API_NOT_FOUND_RESPONSE);
  });

  app.use(MEDIA_PATH, express.static(assetsDir, { fallthrough: false }));

  if (config.NODE_ENV === 'production') {
    app.use(express.static(webDir));
    app.use((_req, res) => {
      res.sendFile(path.join(webDir, INDEX_FILE));
    });
  }

  return app;
}
