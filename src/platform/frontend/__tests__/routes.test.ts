import { describe, expect, it } from 'vitest';
import { modulePath } from '../routes.ts';

describe('routes', () => {
  describe('modulePath', () => {
    it('should put the module under /m when given its id', () => {
      // When
      const path = modulePath('notes');

      // Then
      expect(path).toBe('/m/notes');
    });
  });
});
