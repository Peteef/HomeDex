// Test kit for a module's backend tests (as #platform/backend/testing). It lives in __tests__, so
// the Docker image leaves it out, and lint lets only a module's __tests__ import it.
import path from 'node:path';
import type Database from 'better-sqlite3';
import type { Express } from 'express';
import {
  createTestApp,
  createTestDatabase,
  createTestUser,
  sessionCookieFor,
} from '../../infrastructure/__tests__/helpers.ts';
import { tilesService } from '../../domain/tiles/index.ts';
import { loadModule } from '../../infrastructure/modules/loadModules.ts';
import { migrateModules } from '../../infrastructure/modules/migrateModules.ts';
import type { LoadedModule } from '../../infrastructure/modules/types.ts';
import { runMigrations } from '../../infrastructure/storage/index.ts';
import type { Storage } from '../../infrastructure/storage/index.ts';

const MIGRATIONS_DIR = path.join('backend', 'migrations');
const UTC_ZONE = { TZ: 'UTC' };
const NOON_UTC = 'T12:00:00Z';

export interface ModuleTestApp {
  app: Express;
  storage: Storage;
  // Creates the account on first use and returns its session cookie, for supertest's .set('Cookie', ...).
  signIn: (username: string) => Promise<string>;
}

export interface ModuleTestAppOptions {
  // Fixes the module's ctx.today(), read again on every call, so a test can move to another day.
  today?: () => string;
}

const noonUtcOn =
  (today: () => string): (() => number) =>
  () =>
    Date.parse(`${today()}${NOON_UTC}`);

const addModuleTile = (db: Database.Database, { manifest }: LoadedModule): void => {
  tilesService(db, { enabledModuleIds: [manifest.id] }).syncModuleTiles([
    { moduleId: manifest.id, icon: manifest.icon },
  ]);
};

const createModuleApp = (db: Database.Database, module: LoadedModule, today?: () => string) =>
  today === undefined
    ? createTestApp({}, { db, modules: [module] })
    : createTestApp(UTC_ZONE, { db, modules: [module], now: noonUtcOn(today) });

// An in-memory database with the platform's tables and the module's migrations applied. The
// module's id is its folder name, which the platform enforces.
export const moduleTestStorage = (moduleDir: string): Storage => {
  const storage = createTestDatabase();
  runMigrations(storage, path.basename(moduleDir), path.join(moduleDir, MIGRATIONS_DIR));
  return storage;
};

// The real app with only this module loaded, migrated and on the home tiles, so its routes sit
// behind the real login and request checks.
export const moduleTestApp = async (
  moduleDir: string,
  { today }: ModuleTestAppOptions = {},
): Promise<ModuleTestApp> => {
  const module = await loadModule(path.dirname(moduleDir), path.basename(moduleDir));

  if (module === null) {
    throw new Error(`Module at ${moduleDir} is disabled`);
  }

  const db = createTestDatabase();
  migrateModules(db, [module]);
  addModuleTile(db, module);
  const { app } = createModuleApp(db, module, today);
  const accounts = new Set<string>();

  const signIn = async (username: string) => {
    if (!accounts.has(username)) {
      await createTestUser(db, username);
      accounts.add(username);
    }

    return sessionCookieFor(app, username);
  };

  return {
    app,
    storage: db,
    signIn,
  };
};
