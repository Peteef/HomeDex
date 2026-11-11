import fs from 'node:fs';
import path from 'node:path';
import type { Storage } from './db.ts';

const MIGRATION_FILE = /^(\d{3})_[a-z0-9_]+\.sql$/;

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS schema_migrations (
  scope TEXT NOT NULL,
  version INTEGER NOT NULL,
  name TEXT NOT NULL,
  applied_at INTEGER NOT NULL,
  PRIMARY KEY (scope, version)
)`;

interface Migration {
  version: number;
  name: string;
  file: string;
}

const listMigrations = (directory: string): Migration[] => {
  const migrations = fs
    .readdirSync(directory)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => {
      const match = MIGRATION_FILE.exec(name);

      if (!match?.[1]) {
        throw new Error(`Invalid migration file name: ${name} (expected NNN_name.sql)`);
      }

      return {
        version: Number(match[1]),
        name,
        file: path.join(directory, name),
      };
    });

  const seen = new Set<number>();

  for (const { version, name } of migrations) {
    if (seen.has(version)) {
      throw new Error(`Duplicate migration number ${String(version)}: ${name}`);
    }

    seen.add(version);
  }

  return migrations;
};

// Applies the pending migrations of one scope ("platform" or a module id) in order and
// returns the names it applied. Before the app is live, migrations are edited in place and the
// data folder is reset, so applied files are not checked for changes.
export const runMigrations = (db: Storage, scope: string, directory: string): string[] => {
  db.exec(CREATE_TABLE);

  const applied = new Set(
    db
      .prepare('SELECT version FROM schema_migrations WHERE scope = ?')
      .pluck()
      .all(scope) as number[],
  );

  const record = db.prepare(
    'INSERT INTO schema_migrations (scope, version, name, applied_at) VALUES (?, ?, ?, ?)',
  );

  const appliedNow: string[] = [];

  for (const migration of listMigrations(directory)) {
    if (applied.has(migration.version)) {
      continue;
    }

    const sql = fs.readFileSync(migration.file, 'utf8');

    db.transaction(() => {
      db.exec(sql);
      record.run(scope, migration.version, migration.name, Date.now());
    })();

    appliedNow.push(migration.name);
  }

  return appliedNow;
};
