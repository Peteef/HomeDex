import path from 'node:path';
import { createApp } from './app.ts';
import { loadConfig, loadEnvFile } from './config.ts';
import { ConfigError } from './errors.ts';
import { logger } from './logger.ts';
import { ModuleError } from './modules/errors.ts';
import { setUpModules } from './modules/setUpModules.ts';
import { MigrationError, openStorage } from './storage/index.ts';

const WEB_BUILD_DIR = 'dist/web';
const MODULES_DIR = 'src/modules';
const REPO_ROOT = path.resolve(import.meta.dirname, '../../../..');
const SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM'] as const;
const EXIT_FAILURE = 1;

const start = async (): Promise<void> => {
  loadEnvFile();
  const config = loadConfig();
  const storage = openStorage(path.resolve(config.DATA_DIR));
  const modules = await setUpModules(storage, path.join(REPO_ROOT, MODULES_DIR));

  const app = createApp({
    config,
    storage,
    modules,
    webDir: path.join(REPO_ROOT, WEB_BUILD_DIR),
    assetsDir: path.resolve(config.ASSETS_DIR),
  });

  const announce = (): void => {
    logger.info(`HomeDex listening on http://${config.HOST}:${String(config.PORT)}`);
  };

  const server = app.listen(config.PORT, config.HOST, announce);

  const closeAndExit = (): void => {
    storage.close();
    process.exit(0);
  };

  const shutDown = (): void => {
    server.close(closeAndExit);
  };

  for (const signal of SHUTDOWN_SIGNALS) {
    process.on(signal, shutDown);
  }
};

// A mistake the person running HomeDex can fix gets one line; anything else is a bug and keeps
// its stack trace.
const isExpected = (error: unknown): error is Error =>
  error instanceof ConfigError || error instanceof ModuleError || error instanceof MigrationError;

const reportFailure = (error: unknown): void => {
  if (isExpected(error)) {
    logger.error(error.message);
  } else {
    logger.error('HomeDex could not start', error);
  }
};

try {
  await start();
} catch (error) {
  reportFailure(error);
  process.exit(EXIT_FAILURE);
}
