import { describe, expect, it } from 'vitest';
import { applyTheme } from '../theme.ts';

describe('applyTheme', () => {
  it('should mark the root element with the theme', () => {
    // When
    applyTheme('night');

    // Then
    expect(document.documentElement).toHaveAttribute('data-theme', 'night');
  });

  it('should replace the previous theme', () => {
    // Given
    applyTheme('night');

    // When
    applyTheme('day');

    // Then
    expect(document.documentElement).toHaveAttribute('data-theme', 'day');
  });
});
