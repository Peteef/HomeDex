import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../db.ts';

describe('openDatabase', () => {
  let folder: string | undefined;

  afterEach(() => {
    if (folder) {
      fs.rmSync(folder, { recursive: true, force: true });
      folder = undefined;
    }
  });

  it('should turn foreign keys on when the database opens', () => {
    // When
    const db = openDatabase(':memory:');

    // Then
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
  });

  it('should wait up to 5000 ms for a lock when the database is busy', () => {
    // When
    const db = openDatabase(':memory:');

    // Then
    expect(db.pragma('busy_timeout', { simple: true })).toBe(5000);
  });

  it('should use WAL when the database is a file', () => {
    // Given
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'homedex-db-'));

    // When
    const db = openDatabase(path.join(folder, 'test.sqlite'));

    // Then
    const mode: unknown = db.pragma('journal_mode', { simple: true });
    db.close();
    expect(mode).toBe('wal');
  });
});
