import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LoadFailed } from '../LoadFailed.tsx';

describe('LoadFailed', () => {
  it('should show the message as an alert', () => {
    // When
    render(<LoadFailed message="Could not load the plants." onRetry={vi.fn()} />);

    // Then
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the plants.');
  });

  it('should ask to retry when Try again is pressed', () => {
    // Given
    const onRetry = vi.fn();
    render(<LoadFailed message="Could not load the plants." onRetry={onRetry} />);

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
