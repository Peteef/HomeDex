import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SessionUnavailablePage } from '../SessionUnavailablePage.tsx';

describe('SessionUnavailablePage', () => {
  it('should say HomeDex cannot be reached', () => {
    // When
    render(<SessionUnavailablePage onRetry={vi.fn()} />);

    // Then
    expect(
      screen.getByRole('heading', { level: 1, name: "Can't reach HomeDex" }),
    ).toBeInTheDocument();
  });

  it('should ask to retry when Try again is pressed', () => {
    // Given
    const onRetry = vi.fn();
    render(<SessionUnavailablePage onRetry={onRetry} />);

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
