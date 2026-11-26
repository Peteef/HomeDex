import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DetailedPlant } from '../PlantDetails.tsx';
import { PlantDetailsDialog } from '../PlantDetailsDialog.tsx';

const FERN: DetailedPlant = {
  description: 'Likes shade.',
  tags: ['Shade'],
  lastWateredOn: '2026-11-16',
  nextWateringOn: '2026-11-23',
  daysUntil: 3,
  urgency: 'later',
  summerIntervalDays: 7,
  winterIntervalDays: 21,
  currentSeason: 'winter',
};

const renderDialog = (props: Partial<Parameters<typeof PlantDetailsDialog>[0]> = {}) => {
  const handlers = { onRetry: vi.fn(), onClose: vi.fn() };

  render(
    <PlantDetailsDialog
      title="Bulbasaur's fern"
      plant={FERN}
      failed={false}
      {...handlers}
      {...props}
    />,
  );

  return {
    ...handlers,
    dialog: screen.getByRole('dialog', { name: "Bulbasaur's fern" }),
  };
};

describe('PlantDetailsDialog', () => {
  it('should show the details of the plant', () => {
    // When
    const { dialog } = renderDialog();

    // Then
    expect(within(dialog).getByText('Likes shade.')).toBeInTheDocument();
  });

  it('should say the details are loading before they arrive', () => {
    // When
    const { dialog } = renderDialog({ plant: undefined });

    // Then
    expect(within(dialog).getByRole('status')).toHaveTextContent('Loading…');
  });

  it('should offer to try again when the details cannot be loaded', () => {
    // Given
    const { dialog, onRetry } = renderDialog({ plant: undefined, failed: true });
    expect(within(dialog).getByRole('alert')).toHaveTextContent("Can't load this plant.");

    // When
    fireEvent.click(within(dialog).getByRole('button', { name: 'Try again' }));

    // Then
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('should pass the actions on to the details', () => {
    // Given
    const onEdit = vi.fn();
    const { dialog } = renderDialog({ onEdit });

    // When
    fireEvent.click(within(dialog).getByRole('button', { name: 'Edit' }));

    // Then
    expect(onEdit).toHaveBeenCalledOnce();
    expect(within(dialog).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('should close', () => {
    // Given
    const { dialog, onClose } = renderDialog();

    // When
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));

    // Then
    expect(onClose).toHaveBeenCalledOnce();
  });
});
