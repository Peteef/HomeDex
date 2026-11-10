import path from 'node:path';
import { createApp } from './app.ts';
import { loadConfig, loadEnvFile } from './config.ts';
import { openStorage } from './storage/index.ts';

const WEB_BUILD_DIR = 'dist/web';
const REPO_ROOT = path.resolve(import.meta.dirname, '../../../..');
const SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM'] as const;

loadEnvFile();

const config = loadConfig();
const storage = openStorage(path.resolve(config.DATA_DIR));
const app = createApp({
  config,
  storage,
  webDir: path.join(REPO_ROOT, WEB_BUILD_DIR),
  assetsDir: path.resolve(config.ASSETS_DIR),
});

const server = app.listen(config.PORT, config.HOST, () => {
  console.log(`HomeDex listening on http://${config.HOST}:${String(config.PORT)}`);
});

for (const signal of SHUTDOWN_SIGNALS) {
  process.on(signal, () => {
    server.close(() => {
      storage.close();
      process.exit(0);
    });
  });
}
