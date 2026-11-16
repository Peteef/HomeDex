import { CircleHelp } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { ICON_NAMES } from '../../../../shared/icons/iconNames.ts';
import { resolveIcon } from '../iconRegistry.ts';

describe('icon registry', () => {
  describe('resolveIcon', () => {
    it('should resolve every registered name to its own icon', () => {
      // When / Then
      for (const name of ICON_NAMES) {
        expect(resolveIcon(name)).not.toBe(CircleHelp);
      }
    });

    it('should fall back when the name is unknown', () => {
      // When / Then
      expect(resolveIcon('no-such-icon')).toBe(CircleHelp);
    });

    it('should fall back when the name is an inherited object key', () => {
      // When / Then
      expect(resolveIcon('toString')).toBe(CircleHelp);
    });
  });
});
