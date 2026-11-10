import fs from 'node:fs';
import path from 'node:path';
import { createApp } from './app.ts';
import { loadConfig } from './config.ts';

const ENV_FILE = '.env';
const WEB_BUILD_DIR = 'dist/web';
const REPO_ROOT = path.resolve(import.meta.dirname, '../../..');
const SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM'] as const;

if (fs.existsSync(ENV_FILE)) {
  process.loadEnvFile(ENV_FILE);
}

const config = loadConfig();
const app = createApp({
  config,
  webDir: path.join(REPO_ROOT, WEB_BUILD_DIR),
  assetsDir: path.resolve(config.ASSETS_DIR),
});

const server = app.listen(config.PORT, config.HOST, () => {
  console.log(`HomeDex listening on http://${config.HOST}:${String(config.PORT)}`);
});

for (const signal of SHUTDOWN_SIGNALS) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
