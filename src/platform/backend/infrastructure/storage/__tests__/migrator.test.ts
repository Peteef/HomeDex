import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MigrationError } from '../errors.ts';
import { runMigrations } from '../migrator.ts';
import { createTestDatabase } from '../../__tests__/helpers.ts';

describe('migrator', () => {
  let dir: string;
  let db: Database.Database;

  const write = (name: string, sql: string): void => {
    fs.writeFileSync(path.join(dir, name), sql);
  };

  const tables = (): string[] =>
    (
      db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as {
        name: string;
      }[]
    ).map((row) => row.name);

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'homedex-migrations-'));
    db = new Database(':memory:');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('should apply the migrations in numeric order', () => {
    // Given
    write('002_second.sql', 'CREATE TABLE second (id INTEGER REFERENCES first (id));');
    write('001_first.sql', 'CREATE TABLE first (id INTEGER PRIMARY KEY);');

    // When
    const applied = runMigrations(db, 'demo', dir);

    // Then
    expect(applied).toEqual(['001_first.sql', '002_second.sql']);
    expect(tables()).toEqual(expect.arrayContaining(['first', 'second']));
  });

  it('should skip applied migrations and apply new ones when the applied files are unchanged', () => {
    // Given
    write('001_first.sql', 'CREATE TABLE first (id INTEGER PRIMARY KEY);');
    runMigrations(db, 'demo', dir);
    write('002_second.sql', 'CREATE TABLE second (id INTEGER PRIMARY KEY);');

    // When / Then
    expect(runMigrations(db, 'demo', dir)).toEqual(['002_second.sql']);
    expect(runMigrations(db, 'demo', dir)).toEqual([]);
  });

  it('should store a checksum with every applied migration', () => {
    // Given
    write('001_first.sql', 'CREATE TABLE first (id INTEGER PRIMARY KEY);');

    // When
    runMigrations(db, 'demo', dir);

    // Then
    const checksum = db
      .prepare('SELECT checksum FROM schema_migrations WHERE scope = ? AND version = ?')
      .pluck()
      .get('demo', 1);

    expect(checksum).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should refuse to run and change nothing when an applied migration was edited', () => {
    // Given
    write('001_first.sql', 'CREATE TABLE first (id INTEGER PRIMARY KEY);');
    runMigrations(db, 'demo', dir);
    write('001_first.sql', 'CREATE TABLE edited (id INTEGER PRIMARY KEY);');
    write('002_second.sql', 'CREATE TABLE second (id INTEGER PRIMARY KEY);');

    // When / Then
    expect(() => runMigrations(db, 'demo', dir)).toThrow(MigrationError);

    expect(() => runMigrations(db, 'demo', dir)).toThrow(
      'Migration 001_first.sql of "demo" was changed after it was applied',
    );

    expect(tables()).not.toContain('edited');
    expect(tables()).not.toContain('second');
  });

  it('should ignore an applied migration when its file is gone', () => {
    // Given
    write('001_first.sql', 'CREATE TABLE first (id INTEGER PRIMARY KEY);');
    write('002_second.sql', 'CREATE TABLE second (id INTEGER PRIMARY KEY);');
    runMigrations(db, 'demo', dir);
    fs.rmSync(path.join(dir, '002_second.sql'));

    // When / Then
    expect(runMigrations(db, 'demo', dir)).toEqual([]);
  });

  it('should track every scope separately when two scopes use the same numbers', () => {
    // Given
    write('001_first.sql', 'CREATE TABLE IF NOT EXISTS shared (id INTEGER PRIMARY KEY);');

    // When / Then
    expect(runMigrations(db, 'platform', dir)).toEqual(['001_first.sql']);
    expect(runMigrations(db, 'other-module', dir)).toEqual(['001_first.sql']);
  });

  it('should roll back a failing migration and keep the earlier ones when the SQL is broken', () => {
    // Given
    write('001_first.sql', 'CREATE TABLE first (id INTEGER PRIMARY KEY);');
    write('002_broken.sql', 'CREATE TABLE half (id INTEGER); NOT VALID SQL;');

    // When / Then
    expect(() => runMigrations(db, 'demo', dir)).toThrow();
    expect(tables()).toContain('first');
    expect(tables()).not.toContain('half');
    write('002_broken.sql', 'CREATE TABLE fixed (id INTEGER);');
    expect(runMigrations(db, 'demo', dir)).toEqual(['002_broken.sql']);
  });

  it('should reject a file whose name is not NNN_name.sql', () => {
    // Given
    write('create-users.sql', 'SELECT 1;');

    // When / Then
    expect(() => runMigrations(db, 'demo', dir)).toThrow(/Invalid migration file name/);
  });

  it('should reject two files with the same number', () => {
    // Given
    write('001_first.sql', 'SELECT 1;');
    write('001_other.sql', 'SELECT 1;');

    // When / Then
    expect(() => runMigrations(db, 'demo', dir)).toThrow(/Duplicate migration number 1/);
  });

  it('should create the platform tables when the real migrations run', () => {
    // When
    const real = createTestDatabase();

    // Then
    const names = (
      real.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as {
        name: string;
      }[]
    ).map((row) => row.name);

    expect(names).toEqual(expect.arrayContaining(['users', 'sessions', 'schema_migrations']));
  });
});
