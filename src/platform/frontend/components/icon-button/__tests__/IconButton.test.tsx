import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IconButton } from '../IconButton.tsx';

describe('IconButton', () => {
  it('should be named by its label', () => {
    // When
    render(<IconButton icon={<svg />} label="Close" />);

    // Then
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('should expose the pressed state when pressed is given', () => {
    // When
    render(<IconButton icon={<svg />} label="Pin" pressed />);

    // Then
    expect(screen.getByRole('button', { name: 'Pin' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('should not be a toggle when pressed is not given', () => {
    // When
    render(<IconButton icon={<svg />} label="Close" />);

    // Then
    expect(screen.getByRole('button', { name: 'Close' })).not.toHaveAttribute('aria-pressed');
  });

  it('should call onClick when it is clicked', () => {
    // Given
    const onClick = vi.fn();
    render(<IconButton icon={<svg />} label="Close" onClick={onClick} />);

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    // Then
    expect(onClick).toHaveBeenCalledOnce();
  });
});
