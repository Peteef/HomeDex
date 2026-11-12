import { describe, expect, it } from 'vitest';
import { defineModule } from '../defineModule.ts';

describe('defineModule', () => {
  it('should return the manifest unchanged', () => {
    // Given
    const manifest = {
      id: 'notes',
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
    expect(Object.keys(api).sort()).toEqual([
      'BAD_REQUEST',
      'CREATED',
      'NOT_FOUND',
      'NO_CONTENT',
      'defineModule',
    ]);
  });
});
