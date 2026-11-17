import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingStatus } from '../LoadingStatus.tsx';

describe('LoadingStatus', () => {
  it('should announce loading in a status region when it is shown', () => {
    // When
    render(<LoadingStatus />);

    // Then
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
  });

  it('should be visible, not only for screen readers', () => {
    // When
    render(<LoadingStatus />);

    // Then
    expect(screen.getByRole('status')).not.toHaveClass('sr-only');
  });
});
