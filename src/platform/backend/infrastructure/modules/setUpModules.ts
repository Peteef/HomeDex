import { tilesService } from '../../domain/tiles/index.ts';
import type { EnabledModule } from '../../domain/tiles/index.ts';
import type { Storage } from '../storage/index.ts';
import { loadModules } from './loadModules.ts';
import { migrateModules } from './migrateModules.ts';
import type { LoadedModule } from './types.ts';

const toEnabledModule = ({ manifest }: LoadedModule): EnabledModule => ({
  moduleId: manifest.id,
  icon: manifest.icon,
});

const syncModuleTiles = (storage: Storage, modules: LoadedModule[]): void => {
  const enabledModuleIds = modules.map(({ manifest }) => manifest.id);
  tilesService(storage, { enabledModuleIds }).syncModuleTiles(modules.map(toEnabledModule));
};

// A startup step. An invalid module throws a ModuleError, which stops the server (see main.ts).
export const setUpModules = async (
  storage: Storage,
  modulesDir: string,
): Promise<LoadedModule[]> => {
  const modules = await loadModules(modulesDir);
  migrateModules(storage, modules);
  syncModuleTiles(storage, modules);
  return modules;
};
