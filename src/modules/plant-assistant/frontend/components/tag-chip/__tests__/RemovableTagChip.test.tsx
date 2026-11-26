import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RemovableTagChip } from '../RemovableTagChip.tsx';

describe('RemovableTagChip', () => {
  it('should show the tag', () => {
    // When
    render(<RemovableTagChip tag="Living room" onRemove={vi.fn()} />);

    // Then
    expect(screen.getByText('Living room')).toBeInTheDocument();
  });

  it('should remove the tag with a button named after it', () => {
    // Given
    const onRemove = vi.fn();
    render(<RemovableTagChip tag="Living room" onRemove={onRemove} />);

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Remove Living room' }));

    // Then
    expect(onRemove).toHaveBeenCalledWith('Living room');
  });
});
