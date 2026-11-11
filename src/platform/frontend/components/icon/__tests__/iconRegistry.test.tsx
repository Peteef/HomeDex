import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from '../Icon.tsx';
import { ICON_NAMES } from '../../../../shared/icons/iconNames.ts';
import { FALLBACK_ICON, resolveIcon } from '../iconRegistry.ts';

describe('icon registry', () => {
  describe('resolveIcon', () => {
    it('should resolve every registered name to its own icon', () => {
      // When / Then
      for (const name of ICON_NAMES) {
        expect(resolveIcon(name)).not.toBe(FALLBACK_ICON);
      }
    });

    it('should fall back when the name is unknown', () => {
      // When / Then
      expect(resolveIcon('no-such-icon')).toBe(FALLBACK_ICON);
    });

    it('should fall back when the name is an inherited object key', () => {
      // When / Then
      expect(resolveIcon('toString')).toBe(FALLBACK_ICON);
    });
  });

  describe('Icon', () => {
    it('should render an svg hidden from screen readers', () => {
      // When
      const { container } = render(<Icon name="wallet" />);

      // Then
      expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('should render the fallback icon when the name is unknown', () => {
      // When
      const { container } = render(<Icon name="no-such-icon" />);

      // Then
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should pass the size through', () => {
      // When
      const { container } = render(<Icon name="wallet" size={30} />);

      // Then
      expect(container.querySelector('svg')).toHaveAttribute('width', '30');
    });
  });
});
