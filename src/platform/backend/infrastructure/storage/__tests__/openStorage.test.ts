import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openStorage } from '../index.ts';

describe('openStorage', () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'homedex-storage-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('should create the data folder and migrate the platform tables when the folder does not exist', () => {
    const dataDir = path.join(root, 'nested', 'data');
    const db = openStorage(dataDir);
    const tables = (
      db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]
    ).map((row) => row.name);
    db.close();
    expect(fs.existsSync(dataDir)).toBe(true);
    expect(tables).toEqual(expect.arrayContaining(['users', 'sessions']));
  });

  it('should keep the data and apply no migration twice when the storage is opened again', () => {
    const first = openStorage(root);
    first
      .prepare("INSERT INTO users (username, password_hash, created_at) VALUES ('ash', 'x', 1)")
      .run();
    first.close();

    const second = openStorage(root);
    const users = second.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number };
    const applied = second.prepare('SELECT COUNT(*) AS n FROM schema_migrations').get() as {
      n: number;
    };
    second.close();

    expect(users.n).toBe(1);
    expect(applied.n).toBe(2);
  });
});
