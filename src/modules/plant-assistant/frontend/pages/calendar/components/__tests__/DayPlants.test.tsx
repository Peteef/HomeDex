import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ALOE, FERN, novemberWeeks, TODAY } from '../../__tests__/calendarFixtures.ts';
import { DayPlants } from '../DayPlants.tsx';

const todayWith = (plants: (typeof FERN)[]) => ({
  ...(novemberWeeks()[0]?.[4] ?? { date: TODAY, inMonth: true, isToday: true, isPast: false }),
  plants,
});

describe('DayPlants', () => {
  it('should head the list with the day', () => {
    // When
    render(<DayPlants day={todayWith([FERN])} onOpen={vi.fn()} />);

    // Then
    expect(screen.getByRole('heading', { name: 'Friday, November 20' })).toBeInTheDocument();
  });

  it('should list the plants of the day with their urgency', () => {
    // When
    render(<DayPlants day={todayWith([FERN, ALOE])} onOpen={vi.fn()} />);

    // Then
    expect(screen.getAllByRole('button').map((row) => row.textContent)).toEqual([
      "Bulbasaur's fern3 days overdue",
      "Oddish's aloeToday",
    ]);
  });

  it('should open a plant', () => {
    // Given
    const onOpen = vi.fn();
    render(<DayPlants day={todayWith([FERN])} onOpen={onOpen} />);

    // When
    fireEvent.click(screen.getByRole('button', { name: /Bulbasaur's fern/ }));

    // Then
    expect(onOpen).toHaveBeenCalledWith(FERN);
  });

  it('should say when nothing needs water that day', () => {
    // When
    render(<DayPlants day={todayWith([])} onOpen={vi.fn()} />);

    // Then
    expect(screen.getByText('Nothing to water on this day.')).toBeInTheDocument();
  });

  it('should show the photo of a plant that has one', () => {
    // When
    render(<DayPlants day={todayWith([{ ...FERN, photoId: 4 }])} onOpen={vi.fn()} />);

    // Then
    expect(document.querySelector('img')).toHaveAttribute(
      'src',
      '/api/m/plant-assistant/plants/1/photo?v=4',
    );
  });
});
