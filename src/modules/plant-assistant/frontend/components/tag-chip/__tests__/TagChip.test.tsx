import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TagChip } from '../TagChip.tsx';

describe('TagChip', () => {
  it('should show the tag without a button when it cannot be removed', () => {
    // When
    render(<TagChip tag="Living room" />);

    // Then
    expect(screen.getByText('Living room')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should remove the tag with a button named after it', () => {
    // Given
    const onRemove = vi.fn();
    render(<TagChip tag="Living room" onRemove={onRemove} />);

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Remove Living room' }));

    // Then
    expect(onRemove).toHaveBeenCalledWith('Living room');
  });
});
