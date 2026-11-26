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
    render(<PlantList plants={[CACTUS, FERN]} onOpen={vi.fn()} onSelectTag={vi.fn()} />);

    // Then
    expect(
      screen.getAllByRole('button', { name: /cactus|fern/ }).map((row) => row.textContent),
    ).toEqual(["Cacnea's cactusIn 5 days", "Bulbasaur's fern3 days overdue"]);
  });

  it('should name each row by its plant and urgency', () => {
    // When
    render(<PlantList plants={[FERN, CACTUS]} onOpen={vi.fn()} onSelectTag={vi.fn()} />);

    // Then
    expect(
      screen.getByRole('button', { name: /^Bulbasaur's fern.*3 days overdue$/ }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /^Cacnea's cactus.*In 5 days$/ }),
    ).toBeInTheDocument();
  });

  it('should show the tags of a plant as buttons beside its row', () => {
    // When
    render(<PlantList plants={[FERN]} onOpen={vi.fn()} onSelectTag={vi.fn()} />);

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
    const onSelectTag = vi.fn();
    render(<PlantList plants={[FERN]} onOpen={vi.fn()} onSelectTag={onSelectTag} />);

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Show plants tagged Shade' }));

    // Then
    expect(onSelectTag).toHaveBeenCalledWith('Shade');
  });

  it('should open the plant whose row is pressed', () => {
    // Given
    const onOpen = vi.fn();
    render(<PlantList plants={[FERN, CACTUS]} onOpen={onOpen} onSelectTag={vi.fn()} />);

    // When
    fireEvent.click(screen.getByRole('button', { name: /Cacnea's cactus/ }));

    // Then
    expect(onOpen).toHaveBeenCalledWith(CACTUS);
  });
});
