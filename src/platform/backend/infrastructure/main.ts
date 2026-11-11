import path from 'node:path';
import { createApp } from './app.ts';
import { loadConfig, loadEnvFile } from './config.ts';
import { ModuleError } from './modules/errors.ts';
import { loadModules } from './modules/loadModules.ts';
import { migrateModules } from './modules/migrateModules.ts';
import type { LoadedModule } from './modules/types.ts';
import { openStorage } from './storage/index.ts';

const WEB_BUILD_DIR = 'dist/web';
const MODULES_DIR = 'src/modules';
const REPO_ROOT = path.resolve(import.meta.dirname, '../../../..');
const SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM'] as const;
const EXIT_FAILURE = 1;

const loadModulesOrExit = async (): Promise<LoadedModule[]> => {
  try {
    return await loadModules(path.join(REPO_ROOT, MODULES_DIR));
  } catch (error) {
    if (error instanceof ModuleError) {
      console.error(error.message);
      process.exit(EXIT_FAILURE);
    }

    throw error;
  }
};

loadEnvFile();

const config = loadConfig();
const modules = await loadModulesOrExit();
const storage = openStorage(path.resolve(config.DATA_DIR));
migrateModules(storage, modules);

const app = createApp({
  config,
  storage,
  modules,
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
