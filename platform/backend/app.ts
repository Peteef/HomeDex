import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import type { Config } from './config.ts';

export interface AppOptions {
  config: Config;
  /** Folder with the built UI. Served only when it exists (production). */
  webDir: string;
  /** Folder with all art, served at /media. */
  assetsDir: string;
}

export function createApp({ config, webDir, assetsDir }: AppOptions): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.TRUST_PROXY);
  // HTTPS-only headers (upgrade-insecure-requests, HSTS) would break plain-HTTP use on the LAN
  // (Safari upgrades every asset request to https). They are switched on with HTTPS config only.
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

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use('/media', express.static(assetsDir, { fallthrough: false }));

  if (config.NODE_ENV === 'production') {
    app.use(express.static(webDir));
    app.use((_req, res) => {
      res.sendFile(path.join(webDir, 'index.html'));
    });
  }

  return app;
}
