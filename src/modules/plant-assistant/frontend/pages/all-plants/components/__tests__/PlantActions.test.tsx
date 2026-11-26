import { act, fireEvent, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import { PlantActions } from '../PlantActions.tsx';

describe('PlantActions', () => {
  it('should offer to edit the plant', () => {
    // Given
    const onEdit = vi.fn();
    render(<PlantActions onEdit={onEdit} onDelete={vi.fn()} />);

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    // Then
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('should offer to delete the plant', () => {
    // Given
    const onDelete = vi.fn();
    render(<PlantActions onEdit={vi.fn()} onDelete={onDelete} />);

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    // Then
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('should show its text in Polish', async () => {
    // Given
    await act(() => i18next.changeLanguage('pl'));

    // When
    render(<PlantActions onEdit={vi.fn()} onDelete={vi.fn()} />);

    // Then
    expect(screen.getByRole('button', { name: 'Edytuj' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Usuń' })).toBeInTheDocument();
  });
});
