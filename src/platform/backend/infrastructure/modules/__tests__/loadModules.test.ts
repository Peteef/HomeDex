import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ModuleError } from '../errors.ts';
import { loadModules } from '../loadModules.ts';

const fixtures = (name: string): string => path.join(import.meta.dirname, 'fixtures', name);

describe('loadModules', () => {
  it('should load the enabled modules in folder order', async () => {
    // When
    const modules = await loadModules(fixtures('valid'));

    // Then
    expect(modules.map(({ manifest }) => manifest.id)).toEqual(['clock', 'notes']);
  });

  it('should keep the validated manifest of a module', async () => {
    // When
    const [, notes] = await loadModules(fixtures('valid'));

    // Then
    expect(notes?.manifest).toEqual({
      id: 'notes',
      icon: 'notes',
      route: '/m/notes',
      enabled: true,
    });
  });

  it('should find the register function and migrations of a module with a backend', async () => {
    // When
    const [, notes] = await loadModules(fixtures('valid'));

    // Then
    expect(notes?.register).toBeTypeOf('function');
    expect(notes?.migrationsDir).toBe(path.join(fixtures('valid'), 'notes/backend/migrations'));
  });

  it('should load a module without a backend', async () => {
    // When
    const [clock] = await loadModules(fixtures('valid'));

    // Then
    expect(clock?.register).toBeNull();
    expect(clock?.migrationsDir).toBeNull();
  });

  it('should return no modules when the modules folder does not exist', async () => {
    // When / Then
    expect(await loadModules(fixtures('missing'))).toEqual([]);
  });

  it.each([
    ['wrong-id', 'Module "notes" has the id "other"; it must equal its folder name'],
    ['invalid-manifest', 'Invalid manifest of module "notes": route: must be /m/<id>'],
    ['no-manifest', 'Module "notes" has no manifest.ts'],
    ['no-register', 'backend/index.ts of module "notes" must export register(ctx)'],
    ['reserved', 'The module id "platform" is reserved'],
  ])('should reject the modules in %s', async (folder, message) => {
    // When
    const loading = loadModules(fixtures(folder));

    // Then
    await expect(loading).rejects.toThrow(ModuleError);
    await expect(loading).rejects.toThrow(message);
  });
});
