import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PlantSummary } from '../../../../features/plants/index.ts';
import { PlantList } from '../PlantList.tsx';

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

const CACTUS = plant(2, "Cacnea's cactus");

describe('PlantList', () => {
  it('should show one row per plant in the given order', () => {
    // When
    render(<PlantList plants={[CACTUS, FERN]} onOpen={vi.fn()} />);

    // Then
    expect(screen.getAllByRole('button').map((row) => row.textContent)).toEqual([
      "Cacnea's cactusIn 5 days",
      "Bulbasaur's fernLiving roomShade3 days overdue",
    ]);
  });

  it('should name each row by its plant, tags and urgency', () => {
    // When
    render(<PlantList plants={[FERN, CACTUS]} onOpen={vi.fn()} />);

    // Then
    expect(
      screen.getByRole('button', {
        name: /^Bulbasaur's fern.*Living room.*Shade.*3 days overdue$/,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /^Cacnea's cactus.*In 5 days$/ }),
    ).toBeInTheDocument();
  });

  it('should show the tags of a plant', () => {
    // When
    render(<PlantList plants={[FERN]} onOpen={vi.fn()} />);

    // Then
    const row = screen.getByRole('button', { name: /Bulbasaur's fern/ });
    expect(within(row).getByText('Living room')).toBeInTheDocument();
    expect(within(row).getByText('Shade')).toBeInTheDocument();
  });

  it('should open the plant whose row is pressed', () => {
    // Given
    const onOpen = vi.fn();
    render(<PlantList plants={[FERN, CACTUS]} onOpen={onOpen} />);

    // When
    fireEvent.click(screen.getByRole('button', { name: /Cacnea's cactus/ }));

    // Then
    expect(onOpen).toHaveBeenCalledWith(CACTUS);
  });
});
