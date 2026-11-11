import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createTestDatabase } from '../../__tests__/helpers.ts';
import { loadModules } from '../loadModules.ts';
import { migrateModules } from '../migrateModules.ts';

describe('migrateModules', () => {
  it('should run the migrations of each module in its own scope', async () => {
    // Given
    const db = createTestDatabase();
    const modules = await loadModules(path.join(import.meta.dirname, 'fixtures', 'valid'));

    // When
    migrateModules(db, modules);

    // Then
    expect(db.prepare("SELECT name FROM sqlite_master WHERE name = 'notes_items'").get()).toEqual({
      name: 'notes_items',
    });

    expect(
      db.prepare("SELECT version, name FROM schema_migrations WHERE scope = 'notes'").all(),
    ).toEqual([{ version: 1, name: '001_items.sql' }]);
  });

  it('should apply nothing again when the modules are migrated twice', async () => {
    // Given
    const db = createTestDatabase();
    const modules = await loadModules(path.join(import.meta.dirname, 'fixtures', 'valid'));
    migrateModules(db, modules);

    // When / Then
    expect(() => {
      migrateModules(db, modules);
    }).not.toThrow();
  });
});
