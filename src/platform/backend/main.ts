import fs from 'node:fs';
import path from 'node:path';
import { createApp } from './app.ts';
import { loadConfig } from './config.ts';

if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

const config = loadConfig();
const root = path.resolve(import.meta.dirname, '../../..');
const app = createApp({
  config,
  webDir: path.join(root, 'dist/web'),
  assetsDir: path.resolve(config.ASSETS_DIR),
});

const server = app.listen(config.PORT, config.HOST, () => {
  console.log(`HomeDex listening on http://${config.HOST}:${String(config.PORT)}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
