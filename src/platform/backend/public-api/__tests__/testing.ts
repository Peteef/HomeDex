// Test kit for a module's backend tests (as #platform/backend/testing). It lives in __tests__, so
// the Docker image leaves it out, and lint lets only a module's __tests__ import it.
import path from 'node:path';
import type { Express } from 'express';
import {
  createTestApp,
  createTestDatabase,
  createTestUser,
  sessionCookieFor,
} from '../../infrastructure/__tests__/helpers.ts';
import { loadModule } from '../../infrastructure/modules/loadModules.ts';
import { migrateModules } from '../../infrastructure/modules/migrateModules.ts';
import { runMigrations } from '../../infrastructure/storage/index.ts';
import type { Storage } from '../../infrastructure/storage/index.ts';

const MIGRATIONS_DIR = path.join('backend', 'migrations');

export interface ModuleTestApp {
  app: Express;
  storage: Storage;
  // Creates the account on first use and returns its session cookie, for supertest's .set('Cookie', ...).
  signIn: (username: string) => Promise<string>;
}

// An in-memory database with the platform's tables and the module's migrations applied. The
// module's id is its folder name, which the platform enforces.
export const moduleTestStorage = (moduleDir: string): Storage => {
  const storage = createTestDatabase();
  runMigrations(storage, path.basename(moduleDir), path.join(moduleDir, MIGRATIONS_DIR));
  return storage;
};

// The real app with only this module loaded and migrated, so its routes sit behind the real login
// and request checks.
export const moduleTestApp = async (moduleDir: string): Promise<ModuleTestApp> => {
  const module = await loadModule(path.dirname(moduleDir), path.basename(moduleDir));

  if (module === null) {
    throw new Error(`Module at ${moduleDir} is disabled`);
  }

  const db = createTestDatabase();
  migrateModules(db, [module]);
  const { app } = createTestApp({}, { db, modules: [module] });
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
