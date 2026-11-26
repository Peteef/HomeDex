import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CountBadge } from '../CountBadge.tsx';

describe('CountBadge', () => {
  it('should show the count to the eye only', () => {
    // When
    render(<CountBadge count={3} />);

    // Then
    expect(screen.getByText('3')).toHaveAttribute('aria-hidden', 'true');
  });

  it('should show nothing at zero', () => {
    // When
    const { container } = render(<CountBadge count={0} />);

    // Then
    expect(container).toBeEmptyDOMElement();
  });
});
