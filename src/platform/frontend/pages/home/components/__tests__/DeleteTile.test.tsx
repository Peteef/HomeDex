import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeleteTile } from '../DeleteTile.tsx';

describe('DeleteTile', () => {
  it('should ask before deleting', () => {
    // Given
    const onDelete = vi.fn();
    render(<DeleteTile title="Finances" deleting={false} onDelete={onDelete} />);

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Delete tile' }));

    // Then
    expect(screen.getByText('Delete “Finances”?')).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('should delete when confirmed', () => {
    // Given
    const onDelete = vi.fn();
    render(<DeleteTile title="Finances" deleting={false} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete tile' }));

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    // Then
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('should go back without deleting when cancelled', () => {
    // Given
    const onDelete = vi.fn();
    render(<DeleteTile title="Finances" deleting={false} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete tile' }));

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    // Then
    expect(screen.getByRole('button', { name: 'Delete tile' })).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('should disable both choices while deleting', () => {
    // Given
    render(<DeleteTile title="Finances" deleting onDelete={vi.fn()} />);

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Delete tile' }));

    // Then
    expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});
