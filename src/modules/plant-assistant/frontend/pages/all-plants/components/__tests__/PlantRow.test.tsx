import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PlantSummary } from '../../../../features/plants/index.ts';
import { PlantRow } from '../PlantRow.tsx';

const plant = (id: number, name: string, overrides: Partial<PlantSummary> = {}): PlantSummary => ({
  id,
  name,
  description: null,
  tags: [],
  photoId: null,
  lastWateredOn: '2026-11-18',
  nextWateringOn: '2026-11-25',
  daysUntil: 5,
  urgency: 'later',
  ...overrides,
});

const FERN = plant(1, "Bulbasaur's fern", {
  tags: ['Living room', 'Shade'],
  daysUntil: -3,
  urgency: 'overdue',
});

const renderRow = (shown: PlantSummary = FERN) => {
  const handlers = { onOpen: vi.fn(), onSelectTag: vi.fn() };

  render(
    <ul>
      <PlantRow plant={shown} {...handlers} />
    </ul>,
  );

  return handlers;
};

describe('PlantRow', () => {
  it('should name the row by its plant and urgency', () => {
    // When
    renderRow();

    // Then
    expect(
      screen.getByRole('button', { name: /^Bulbasaur's fern.*3 days overdue$/ }),
    ).toBeInTheDocument();
  });

  it('should show the tags as buttons beside the row', () => {
    // When
    renderRow();

    // Then
    const row = screen.getByRole('button', { name: /Bulbasaur's fern/ });
    expect(within(row).queryByText('Shade')).not.toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Show plants tagged Living room' }),
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Show plants tagged Shade' })).toBeInTheDocument();
  });

  it('should select the tag that is pressed', () => {
    // Given
    const { onSelectTag } = renderRow();

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Show plants tagged Shade' }));

    // Then
    expect(onSelectTag).toHaveBeenCalledWith('Shade');
  });

  it('should open the plant', () => {
    // Given
    const { onOpen } = renderRow();

    // When
    fireEvent.click(screen.getByRole('button', { name: /Bulbasaur's fern/ }));

    // Then
    expect(onOpen).toHaveBeenCalledWith(FERN);
  });

  it('should show the photo of the plant', () => {
    // When
    renderRow({ ...FERN, photoId: 4 });

    // Then
    expect(document.querySelector('img')).toHaveAttribute(
      'src',
      '/api/m/plant-assistant/plants/1/photo?v=4',
    );
  });
});
