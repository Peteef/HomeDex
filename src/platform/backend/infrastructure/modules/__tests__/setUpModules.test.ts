import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestDatabase } from '../../__tests__/helpers.ts';
import { setUpModules } from '../setUpModules.ts';

const fixtures = (name: string): string => path.join(import.meta.dirname, 'fixtures', name);

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
