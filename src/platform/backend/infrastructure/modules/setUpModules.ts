import { logger } from '../logger.ts';
import type { Storage } from '../storage/index.ts';
import { ModuleError } from './errors.ts';
import { loadModules } from './loadModules.ts';
import { migrateModules } from './migrateModules.ts';
import type { LoadedModule } from './types.ts';

const EXIT_FAILURE = 1;

// A startup step: an invalid module stops the server with its problem, not with a stack trace.
export const setUpModules = async (
  storage: Storage,
  modulesDir: string,
): Promise<LoadedModule[]> => {
  try {
    const modules = await loadModules(modulesDir);
    migrateModules(storage, modules);
    return modules;
  } catch (error) {
    if (error instanceof ModuleError) {
      logger.error(error.message);
      process.exit(EXIT_FAILURE);
    }

    throw error;
  }
};
