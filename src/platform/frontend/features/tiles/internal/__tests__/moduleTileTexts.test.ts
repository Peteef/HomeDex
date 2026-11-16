import { describe, expect, it, vi } from 'vitest';
import { MODULE_TILE_TEXTS } from '../moduleTileTexts.ts';

vi.mock('../../../modules/index.ts', () => ({
  MODULE_PAGES: [],
  MODULE_TRANSLATIONS: [
    {
      namespace: 'notes',
      language: 'en',
      messages: { manifest: { name: 'Notes', description: 'Quick notes' } },
    },
    { namespace: 'notes', language: 'pl', messages: { manifest: { name: 'Notatki' } } },
    { namespace: 'notes', language: 'de', messages: { manifest: { name: 'Notizen' } } },
    { namespace: 'clock', language: 'en', messages: { list: { title: 'Clock' } } },
  ],
}));

describe('MODULE_TILE_TEXTS', () => {
  it('should take the title and description from the manifest text when both are given', () => {
    // When / Then
    expect(MODULE_TILE_TEXTS.notes?.en).toEqual({ title: 'Notes', description: 'Quick notes' });
  });

  it('should use null when there is no description', () => {
    // When / Then
    expect(MODULE_TILE_TEXTS.notes?.pl).toEqual({ title: 'Notatki', description: null });
  });

  it('should keep the languages of one module together when it has several', () => {
    // When / Then
    expect(Object.keys(MODULE_TILE_TEXTS.notes ?? {})).toEqual(['en', 'pl']);
  });

  it('should leave out a language when the platform does not support it', () => {
    // When / Then
    expect(MODULE_TILE_TEXTS.notes).not.toHaveProperty('de');
  });

  it('should leave out a module when its text has no manifest name', () => {
    // When / Then
    expect(Object.keys(MODULE_TILE_TEXTS)).toEqual(['notes']);
  });
});
