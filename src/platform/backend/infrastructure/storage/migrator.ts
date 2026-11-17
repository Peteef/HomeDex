import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Storage } from './db.ts';
import { MigrationError } from './errors.ts';

const MIGRATION_FILE = /^(\d{3})_[a-z0-9_]+\.sql$/;

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS schema_migrations (
  scope TEXT NOT NULL,
  version INTEGER NOT NULL,
  name TEXT NOT NULL,
  checksum TEXT NOT NULL,
  applied_at INTEGER NOT NULL,
  PRIMARY KEY (scope, version)
)`;

interface Migration {
  version: number;
  name: string;
  file: string;
}

interface AppliedMigration {
  version: number;
  checksum: string;
}

const toMigration = (directory: string, name: string): Migration => {
  const match = MIGRATION_FILE.exec(name);

  if (!match?.[1]) {
    throw new Error(`Invalid migration file name: ${name} (expected NNN_name.sql)`);
  }

  return {
    version: Number(match[1]),
    name,
    file: path.join(directory, name),
  };
};

const listMigrations = (directory: string): Migration[] => {
  const migrations = fs
    .readdirSync(directory)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => toMigration(directory, name));

  const seen = new Set<number>();

  for (const { version, name } of migrations) {
    if (seen.has(version)) {
      throw new Error(`Duplicate migration number ${String(version)}: ${name}`);
    }

    seen.add(version);
  }

  return migrations;
};

const checksumOf = (sql: string): string => createHash('sha256').update(sql).digest('hex');

// Applies the pending migrations of one scope ("platform" or a module id) in order and returns
// the names it applied. An applied migration is final: when its file changes afterwards, the
// start is refused, because databases that already ran it would silently miss the change.
export const runMigrations = (db: Storage, scope: string, directory: string): string[] => {
  db.exec(CREATE_TABLE);

  const appliedRows = db
    .prepare('SELECT version, checksum FROM schema_migrations WHERE scope = ?')
    .all(scope) as AppliedMigration[];

  const applied = new Map(appliedRows.map(({ version, checksum }) => [version, checksum]));

  const record = db.prepare(
    'INSERT INTO schema_migrations (scope, version, name, checksum, applied_at) VALUES (?, ?, ?, ?, ?)',
  );

  const appliedNow: string[] = [];

  for (const migration of listMigrations(directory)) {
    const sql = fs.readFileSync(migration.file, 'utf8');
    const checksum = checksumOf(sql);
    const appliedChecksum = applied.get(migration.version);

    if (appliedChecksum === undefined) {
      db.transaction(() => {
        db.exec(sql);
        record.run(scope, migration.version, migration.name, checksum, Date.now());
      })();

      appliedNow.push(migration.name);
    } else if (appliedChecksum !== checksum) {
      throw new MigrationError(
        `Migration ${migration.name} of "${scope}" was changed after it was applied. Restore the file and add a new migration instead.`,
      );
    }
  }

  return appliedNow;
};
