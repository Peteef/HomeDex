import { runMigrations } from '../storage/index.ts';
import type { Storage } from '../storage/index.ts';
import type { LoadedModule } from './types.ts';

export const migrateModules = (storage: Storage, modules: LoadedModule[]): void => {
  for (const { manifest, migrationsDir } of modules) {
    if (migrationsDir !== null) {
      runMigrations(storage, manifest.id, migrationsDir);
    }
  }
};
