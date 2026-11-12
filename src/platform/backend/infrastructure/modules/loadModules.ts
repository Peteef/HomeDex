import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { manifestSchema } from '../../../shared/manifest/manifestSchema.ts';
import type { ModuleManifest } from '../../../shared/manifest/manifestSchema.ts';
import { PLATFORM_SCOPE } from '../storage/index.ts';
import { ModuleError } from './errors.ts';
import type { LoadedModule, RegisterModule } from './types.ts';

const MANIFEST_FILE = 'manifest.ts';
const BACKEND_ENTRY = path.join('backend', 'index.ts');
const MIGRATIONS_DIR = path.join('backend', 'migrations');

const importFile = async (file: string): Promise<Record<string, unknown>> =>
  (await import(pathToFileURL(file).href)) as Record<string, unknown>;

// Git does not keep empty folders, so the modules folder is missing when there are no modules.
const listModuleFolders = (modulesDir: string): string[] =>
  fs.existsSync(modulesDir)
    ? fs
        .readdirSync(modulesDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
    : [];

const describeProblems = (issues: { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.map(String).join('.')}: ${issue.message}`).join('; ');

const readManifest = async (moduleDir: string, folder: string): Promise<ModuleManifest> => {
  const file = path.join(moduleDir, MANIFEST_FILE);

  if (!fs.existsSync(file)) {
    throw new ModuleError(`Module "${folder}" has no ${MANIFEST_FILE}`);
  }

  const result = manifestSchema.safeParse((await importFile(file)).default);

  if (!result.success) {
    throw new ModuleError(
      `Invalid manifest of module "${folder}": ${describeProblems(result.error.issues)}`,
    );
  }

  return result.data;
};

const requireValidId = ({ id }: ModuleManifest, folder: string): void => {
  if (id !== folder) {
    throw new ModuleError(`Module "${folder}" has the id "${id}"; it must equal its folder name`);
  }

  if (id === PLATFORM_SCOPE) {
    throw new ModuleError(`The module id "${id}" is reserved`);
  }
};

const readRegister = async (moduleDir: string, id: string): Promise<RegisterModule | null> => {
  const file = path.join(moduleDir, BACKEND_ENTRY);

  if (!fs.existsSync(file)) {
    return null;
  }

  const { register } = await importFile(file);

  if (typeof register !== 'function') {
    throw new ModuleError(`${BACKEND_ENTRY} of module "${id}" must export register(ctx)`);
  }

  return register as RegisterModule;
};

const findMigrations = (moduleDir: string): string | null => {
  const directory = path.join(moduleDir, MIGRATIONS_DIR);
  return fs.existsSync(directory) ? directory : null;
};

export const loadModule = async (
  modulesDir: string,
  folder: string,
): Promise<LoadedModule | null> => {
  const moduleDir = path.join(modulesDir, folder);
  const manifest = await readManifest(moduleDir, folder);
  requireValidId(manifest, folder);

  if (!manifest.enabled) {
    return null;
  }

  return {
    manifest,
    register: await readRegister(moduleDir, manifest.id),
    migrationsDir: findMigrations(moduleDir),
  };
};

// Returns the enabled modules. A disabled module's backend is never imported, so its code cannot
// break the server; its manifest is still validated. Any invalid module stops the start.
export const loadModules = async (modulesDir: string): Promise<LoadedModule[]> => {
  const modules = await Promise.all(
    listModuleFolders(modulesDir).map((folder) => loadModule(modulesDir, folder)),
  );

  return modules.filter((module) => module !== null);
};
