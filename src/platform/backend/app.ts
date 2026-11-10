import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import type { Config } from './config.ts';

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
