import fs from 'node:fs';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { openDatabase } from './db.ts';
import { runMigrations } from './migrator.ts';

const DATABASE_FILE = 'homedex.db';
export const PLATFORM_SCOPE = 'platform';
const PLATFORM_MIGRATIONS_DIR = path.join(import.meta.dirname, 'migrations');

export const migratePlatform = (db: Database.Database): void => {
  runMigrations(db, PLATFORM_SCOPE, PLATFORM_MIGRATIONS_DIR);
};

export const openStorage = (dataDir: string): Database.Database => {
  fs.mkdirSync(dataDir, { recursive: true });
  const db = openDatabase(path.join(dataDir, DATABASE_FILE));
  migratePlatform(db);
  return db;
};
