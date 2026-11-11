import { describe, expect, it } from 'vitest';
import { defineModule } from '../defineModule.ts';

describe('defineModule', () => {
  it('should return the manifest unchanged', () => {
    // Given
    const manifest = {
      id: 'notes',
      name: 'Notes',
      icon: 'notes',
      route: '/m/notes',
      enabled: true,
    } as const;

    // When / Then
    expect(defineModule(manifest)).toBe(manifest);
  });

  it('should be exported through #platform/shared', async () => {
    // When
    const api = await import('#platform/shared');

    // Then
    expect(Object.keys(api)).toEqual(['defineModule']);
  });
});
