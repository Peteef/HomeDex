import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SelectableTagChip } from '../SelectableTagChip.tsx';

describe('SelectableTagChip', () => {
  it('should show the tag', () => {
    // When
    render(<SelectableTagChip tag="Living room" onSelect={vi.fn()} />);

    // Then
    expect(screen.getByText('Living room')).toBeInTheDocument();
  });

  it('should be a button that selects the tag', () => {
    // Given
    const onSelect = vi.fn();
    render(<SelectableTagChip tag="Living room" onSelect={onSelect} />);

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Show plants tagged Living room' }));

    // Then
    expect(onSelect).toHaveBeenCalledWith('Living room');
  });
});
