import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TileBadge } from '../TileBadge.tsx';

describe('TileBadge', () => {
  it.each([
    [1, '1'],
    [99, '99'],
    [100, '99+'],
    [1234, '99+'],
  ])('should show %i as %s', (count, shown) => {
    // When
    const { container } = render(<TileBadge count={count} />);

    // Then
    expect(container).toHaveTextContent(shown, { normalizeWhitespace: false });
  });

  it('should hide the number from screen readers', () => {
    // When
    const { container } = render(<TileBadge count={3} />);

    // Then
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});
