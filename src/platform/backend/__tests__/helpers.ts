import path from 'node:path';
import type Database from 'better-sqlite3';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../app.ts';
import { loadConfig } from '../config.ts';
import type { ScryptParams } from '../accounts/index.ts';
import { services } from '../services.ts';
import type { Services } from '../services.ts';
import { migratePlatform, openDatabase } from '../storage/index.ts';

const root = path.resolve(import.meta.dirname, '../../../..');
const IN_MEMORY = ':memory:';

export const FAST_SCRYPT: ScryptParams = { N: 16, r: 1, p: 1 };
export const TEST_PASSWORD = 'correct-horse-battery';

export function createTestDatabase(): Database.Database {
  const db = openDatabase(IN_MEMORY);
  migratePlatform(db);
  return db;
}

export interface TestApp {
  app: Express;
  db: Database.Database;
  clock: { now: number };
}

export function createTestApp(env: Record<string, string> = {}): TestApp {
  const db = createTestDatabase();
  const clock = { now: Date.now() };
  const app = createApp({
    config: loadConfig(env),
    storage: db,
    webDir: path.join(root, 'dist/web'),
    assetsDir: path.join(root, 'assets'),
    scryptParams: FAST_SCRYPT,
    now: () => clock.now,
  });
  return { app, db, clock };
}

export function testServices(db: Database.Database): Services {
  return services(db, loadConfig({}), { scryptParams: FAST_SCRYPT });
}

export async function createTestUser(db: Database.Database, username: string): Promise<void> {
  await testServices(db).accounts.create(username, TEST_PASSWORD);
}

export function postJson(app: Express, url: string, body?: unknown): request.Test {
  return request(app)
    .post(url)
    .set('Content-Type', 'application/json')
    .send(JSON.stringify(body ?? {}));
}
