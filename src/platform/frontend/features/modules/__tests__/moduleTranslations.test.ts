import { describe, expect, it } from 'vitest';
import type { ModuleManifest } from '../../../../shared/manifest/manifestSchema.ts';
import { moduleTranslations } from '../internal/moduleTranslations.ts';

const manifestOf = (id: string, enabled = true): ModuleManifest => ({
  id,
  icon: 'star',
  route: `/m/${id}`,
  enabled,
});

describe('moduleTranslations', () => {
  it("should give each language file of an enabled module the module's namespace", () => {
    // Given
    const manifests = { '/src/modules/notes/manifest.ts': manifestOf('notes') };

    const files = {
      '/src/modules/notes/frontend/locales/en.ts': { title: 'Notes' },
      '/src/modules/notes/frontend/locales/pl.ts': { title: 'Notatki' },
    };

    // When
    const translations = moduleTranslations(manifests, files);

    // Then
    expect(translations).toEqual([
      { namespace: 'notes', language: 'en', messages: { title: 'Notes' } },
      { namespace: 'notes', language: 'pl', messages: { title: 'Notatki' } },
    ]);
  });

  it('should leave out a disabled module', () => {
    // Given
    const manifests = { '/src/modules/notes/manifest.ts': manifestOf('notes', false) };
    const files = { '/src/modules/notes/frontend/locales/en.ts': { title: 'Notes' } };

    // When / Then
    expect(moduleTranslations(manifests, files)).toEqual([]);
  });

  it('should not give a module the files of a module whose id starts the same', () => {
    // Given
    const manifests = { '/src/modules/notes/manifest.ts': manifestOf('notes') };
    const files = { '/src/modules/notes-archive/frontend/locales/en.ts': { title: 'Archive' } };

    // When / Then
    expect(moduleTranslations(manifests, files)).toEqual([]);
  });

  it('should leave out a file in a folder below the locales folder', () => {
    // Given
    const manifests = { '/src/modules/notes/manifest.ts': manifestOf('notes') };
    const files = { '/src/modules/notes/frontend/locales/old/en.ts': { title: 'Notes' } };

    // When / Then
    expect(moduleTranslations(manifests, files)).toEqual([]);
  });
});
