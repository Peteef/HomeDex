import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AddTileButton } from '../AddTileButton.tsx';

describe('AddTileButton', () => {
  it('should call onAdd when clicked', () => {
    // Given
    const onAdd = vi.fn();
    render(<AddTileButton onAdd={onAdd} />);

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Add tile' }));

    // Then
    expect(onAdd).toHaveBeenCalledOnce();
  });
});
