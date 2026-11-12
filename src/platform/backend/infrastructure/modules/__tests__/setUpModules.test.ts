import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type Database from 'better-sqlite3';
import { createTestDatabase } from '../../__tests__/helpers.ts';
import { setUpModules } from '../setUpModules.ts';

const fixtures = (name: string): string => path.join(import.meta.dirname, 'fixtures', name);

const moduleTiles = (db: Database.Database): unknown[] =>
  db
    .prepare("SELECT dex_no, module_id, icon FROM tiles WHERE kind = 'module' ORDER BY dex_no")
    .all();

describe('setUpModules', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return the enabled modules with their tables created', async () => {
    // Given
    const db = createTestDatabase();

    // When
    const modules = await setUpModules(db, fixtures('valid'));

    // Then
    expect(modules.map(({ manifest }) => manifest.id)).toEqual(['clock', 'notes']);
    expect(db.prepare('SELECT COUNT(*) AS count FROM notes_items').get()).toEqual({ count: 0 });
  });

  it('should add a tile for each enabled module', async () => {
    // Given
    const db = createTestDatabase();

    // When
    await setUpModules(db, fixtures('valid'));

    // Then
    expect(moduleTiles(db)).toEqual([
      { dex_no: 1, module_id: 'clock', icon: 'calendar' },
      { dex_no: 2, module_id: 'notes', icon: 'notes' },
    ]);
  });

  it('should keep the tile of a module that disappears between two starts', async () => {
    // Given
    const db = createTestDatabase();
    await setUpModules(db, fixtures('valid'));

    // When
    await setUpModules(db, fixtures('clock-only'));

    // Then
    expect(moduleTiles(db)).toEqual([
      { dex_no: 1, module_id: 'clock', icon: 'calendar' },
      { dex_no: 2, module_id: 'notes', icon: 'notes' },
    ]);
  });

  it('should print the problem and exit with 1 when a module is invalid', async () => {
    // Given
    const printError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exited');
    });

    // When
    const setUp = setUpModules(createTestDatabase(), fixtures('wrong-id'));

    // Then
    await expect(setUp).rejects.toThrow('exited');
    expect(exit).toHaveBeenCalledWith(1);

    expect(printError).toHaveBeenCalledWith(
      'Module "notes" has the id "other"; it must equal its folder name',
    );
  });
});
