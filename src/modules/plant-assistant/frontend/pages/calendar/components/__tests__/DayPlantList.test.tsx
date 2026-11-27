import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CalendarDay } from '../../../../features/calendar/index.ts';
import { ALOE, FERN } from '../../__tests__/calendarFixtures.ts';
import { DayPlantList } from '../DayPlantList.tsx';

const dayWith = (plants: CalendarDay['plants']): CalendarDay => ({
  date: '2026-11-20',
  inMonth: true,
  isToday: true,
  isPast: false,
  plants,
});

describe('DayPlantList', () => {
  it('should list the plants of the day in their order', () => {
    // When
    render(<DayPlantList day={dayWith([FERN, ALOE])} onOpen={vi.fn()} />);

    // Then
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      "Bulbasaur's fern3 days overdue",
      "Oddish's aloeToday",
    ]);
  });

  it('should open a plant', () => {
    // Given
    const onOpen = vi.fn();
    render(<DayPlantList day={dayWith([FERN])} onOpen={onOpen} />);

    // When
    fireEvent.click(screen.getByRole('button', { name: /^Bulbasaur's fern/ }));

    // Then
    expect(onOpen).toHaveBeenCalledWith(FERN);
  });

  it('should say when nothing needs water that day', () => {
    // When
    render(<DayPlantList day={dayWith([])} onOpen={vi.fn()} />);

    // Then
    expect(screen.getByText('Nothing to water on this day.')).toBeInTheDocument();
  });
});
