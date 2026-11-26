import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PlantSummary } from '../../../../features/plants/index.ts';
import type { TodayBoardProps } from '../TodayBoard.tsx';
import { TodayBoard } from '../TodayBoard.tsx';

const plant = (id: number, name: string, overrides: Partial<PlantSummary> = {}): PlantSummary => ({
  id,
  name,
  description: null,
  tags: [],
  photoId: null,
  lastWateredOn: '2026-11-10',
  nextWateringOn: '2026-11-17',
  daysUntil: -3,
  urgency: 'overdue',
  ...overrides,
});

const FERN = plant(1, "Bulbasaur's fern");
const ALOE = plant(2, "Oddish's aloe", { daysUntil: 0, urgency: 'today' });

const renderBoard = (props: Partial<TodayBoardProps> = {}) => {
  const handlers = {
    onOpen: vi.fn(),
    onWater: vi.fn(),
    onPostpone: vi.fn(),
  };

  render(<TodayBoard plants={[FERN, ALOE]} {...handlers} {...props} />);
  return handlers;
};

describe('TodayBoard', () => {
  it('should show one card per plant in the given order, with its urgency', () => {
    // When
    renderBoard();

    // Then
    const cards = screen.getAllByRole('listitem');
    expect(within(cards[0] ?? document.body).getByText('3 days overdue')).toBeInTheDocument();

    expect(cards.map((card) => within(card).getAllByRole('button')[0]?.textContent)).toEqual([
      "Bulbasaur's fern",
      "Oddish's aloe",
    ]);
  });

  it.each([
    ['open', "Oddish's aloe", 'onOpen'],
    ['water', "Watered: Oddish's aloe", 'onWater'],
    ['postpone', "Postpone: Oddish's aloe", 'onPostpone'],
  ] as const)('should pass on a request to %s a plant', (_action, button, handler) => {
    // Given
    const handlers = renderBoard();

    // When
    fireEvent.click(screen.getByRole('button', { name: button }));

    // Then
    expect(handlers[handler]).toHaveBeenCalledWith(ALOE);
  });

  it('should show the photo of a plant that has one', () => {
    // When
    renderBoard({ plants: [{ ...FERN, photoId: 4 }, ALOE] });

    // Then
    expect(document.querySelectorAll('img')).toHaveLength(1);

    expect(document.querySelector('img')).toHaveAttribute(
      'src',
      '/api/m/plant-assistant/plants/1/photo?v=4',
    );
  });
});
