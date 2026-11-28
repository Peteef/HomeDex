import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeleteConfirmation } from '../DeleteConfirmation.tsx';

describe('DeleteConfirmation', () => {
  it('should warn that the history goes too and it cannot be undone', () => {
    // When
    render(
      <DeleteConfirmation deleting={false} failed={false} onDelete={vi.fn()} onCancel={vi.fn()} />,
    );

    // Then
    expect(
      screen.getByText("Its watering history goes with it. You can't undo this."),
    ).toBeInTheDocument();
  });

  it('should delete', () => {
    // Given
    const onDelete = vi.fn();

    render(
      <DeleteConfirmation deleting={false} failed={false} onDelete={onDelete} onCancel={vi.fn()} />,
    );

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    // Then
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('should cancel', () => {
    // Given
    const onCancel = vi.fn();

    render(
      <DeleteConfirmation deleting={false} failed={false} onDelete={vi.fn()} onCancel={onCancel} />,
    );

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    // Then
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('should disable both buttons while deleting', () => {
    // When
    render(<DeleteConfirmation deleting failed={false} onDelete={vi.fn()} onCancel={vi.fn()} />);

    // Then
    expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('should say so when deleting failed', () => {
    // When
    render(<DeleteConfirmation deleting={false} failed onDelete={vi.fn()} onCancel={vi.fn()} />);

    // Then
    expect(screen.getByRole('alert')).toHaveTextContent("Can't delete the plant. Try again.");
  });
});
