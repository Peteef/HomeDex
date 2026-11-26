import { act, fireEvent, render, screen, within } from '@testing-library/react';
import i18next from 'i18next';
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
const IVY = plant(3, "Tangela's ivy", { daysUntil: 2, urgency: 'soon' });

const renderBoard = (props: Partial<TodayBoardProps> = {}) => {
  const handlers = {
    onOpen: vi.fn(),
    onWater: vi.fn(),
    onPostpone: vi.fn(),
  };

  render(<TodayBoard plants={[FERN, ALOE]} next={IVY} hasPlants {...handlers} {...props} />);
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

  it('should name each card button after its plant', () => {
    // When
    renderBoard();

    // Then
    expect(screen.getByRole('button', { name: "Watered: Bulbasaur's fern" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Postpone: Oddish's aloe" })).toBeInTheDocument();
  });

  it.each([
    ['open', "Bulbasaur's fern", 'onOpen'],
    ['water', "Watered: Bulbasaur's fern", 'onWater'],
    ['postpone', "Postpone: Bulbasaur's fern", 'onPostpone'],
  ] as const)('should %s the plant', (_action, button, handler) => {
    // Given
    const handlers = renderBoard();

    // When
    fireEvent.click(screen.getByRole('button', { name: button }));

    // Then
    expect(handlers[handler]).toHaveBeenCalledWith(FERN);
  });

  it('should say nothing needs water and name the next plant', () => {
    // When
    renderBoard({ plants: [] });

    // Then
    expect(screen.getByRole('status')).toHaveTextContent(
      "Nothing to water today.Next: Tangela's ivy,In 2 days",
    );
  });

  it('should say nothing needs water and point to the plants when there are none', () => {
    // When
    renderBoard({ plants: [], next: null, hasPlants: false });

    // Then
    expect(screen.getByRole('status')).toHaveTextContent('Nothing to water today.');
    expect(screen.getByText('Add your plants on the Plants tab.')).toHaveClass('lg:hidden');
    expect(screen.getByText('Add your plants under All plants.')).toHaveClass('hidden lg:inline');
  });

  it('should show its text in Polish', async () => {
    // Given
    await act(() => i18next.changeLanguage('pl'));

    // When
    renderBoard();

    // Then
    expect(screen.getByRole('button', { name: "Podlane: Bulbasaur's fern" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Przełóż: Bulbasaur's fern" })).toBeInTheDocument();
  });
});
