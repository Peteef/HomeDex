import path from 'node:path';
import type Database from 'better-sqlite3';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../app.ts';
import type { LoginLimit } from '../http/auth/loginRateLimit.ts';
import type { LoadedModule } from '../modules/types.ts';
import { loadConfig } from '../config.ts';
import type { Argon2Params } from '../../domain/accounts/index.ts';
import { domainServices } from '../../domain/services.ts';
import type { DomainServices } from '../../domain/services.ts';
import { migratePlatform, openDatabase } from '../storage/index.ts';

const root = path.resolve(import.meta.dirname, '../../../../..');
const IN_MEMORY = ':memory:';
const SESSION_TTL_DAYS = 365;

export const FAST_ARGON2: Argon2Params = { memory: 8, passes: 1, parallelism: 1 };
export const TEST_PASSWORD = 'correct-horse-battery';

export const createTestDatabase = (): Database.Database => {
  const db = openDatabase(IN_MEMORY);
  migratePlatform(db);
  return db;
};

export interface TestApp {
  app: Express;
  db: Database.Database;
  clock: { now: number };
}

export const createTestApp = (
  env: Record<string, string> = {},
  overrides: { loginLimit?: LoginLimit; modules?: LoadedModule[] } = {},
): TestApp => {
  const db = createTestDatabase();
  const clock = { now: Date.now() };

  const app = createApp({
    config: loadConfig(env),
    storage: db,
    modules: [],
    webDir: path.join(root, 'dist/web'),
    assetsDir: path.join(root, 'assets'),
    argon2Params: FAST_ARGON2,
    now: () => clock.now,
    ...overrides,
  });

  return {
    app,
    db,
    clock,
  };
};

export const testServices = (db: Database.Database): DomainServices =>
  domainServices(db, { sessionTtlDays: SESSION_TTL_DAYS, argon2Params: FAST_ARGON2 });

export const createTestUser = async (db: Database.Database, username: string): Promise<void> => {
  await testServices(db).accounts.create(username, TEST_PASSWORD);
};

export const postJson = (app: Express, url: string, body?: unknown): request.Test =>
  request(app)
    .post(url)
    .set('Content-Type', 'application/json')
    .send(JSON.stringify(body ?? {}));

export const sessionCookieFor = async (app: Express, username: string): Promise<string> => {
  const response = await postJson(app, '/api/auth/login', { username, password: TEST_PASSWORD });
  const [cookie] = (response.headers['set-cookie'] as string[] | undefined) ?? [];

  if (!cookie) {
    throw new Error(`Could not sign in as "${username}"`);
  }

  return cookie.split(';')[0] ?? '';
};
