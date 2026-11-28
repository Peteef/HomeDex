import { act, fireEvent, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import type { PlantSummary } from '../../../../features/plants/index.ts';
import { TodayPlantCard } from '../TodayPlantCard.tsx';

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

const renderCard = () => {
  const handlers = {
    onOpen: vi.fn(),
    onWater: vi.fn(),
    onPostpone: vi.fn(),
  };

  render(
    <ul>
      <TodayPlantCard plant={FERN} {...handlers} />
    </ul>,
  );

  return handlers;
};

describe('TodayPlantCard', () => {
  it('should show the plant with its urgency', () => {
    // When
    renderCard();

    // Then
    expect(screen.getByRole('button', { name: "Bulbasaur's fern" })).toBeInTheDocument();
    expect(screen.getByText('3 days overdue')).toBeInTheDocument();
  });

  it('should name its buttons after the plant', () => {
    // When
    renderCard();

    // Then
    expect(screen.getByRole('button', { name: "Watered: Bulbasaur's fern" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Postpone: Bulbasaur's fern" })).toBeInTheDocument();
  });

  it.each([
    ['open', "Bulbasaur's fern", 'onOpen'],
    ['water', "Watered: Bulbasaur's fern", 'onWater'],
    ['postpone', "Postpone: Bulbasaur's fern", 'onPostpone'],
  ] as const)('should %s the plant', (_action, button, handler) => {
    // Given
    const handlers = renderCard();

    // When
    fireEvent.click(screen.getByRole('button', { name: button }));

    // Then
    expect(handlers[handler]).toHaveBeenCalledWith(FERN);
  });

  it('should show its text in Polish', async () => {
    // Given
    await act(() => i18next.changeLanguage('pl'));

    // When
    renderCard();

    // Then
    expect(screen.getByRole('button', { name: "Podlane: Bulbasaur's fern" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Przełóż: Bulbasaur's fern" })).toBeInTheDocument();
  });
});
