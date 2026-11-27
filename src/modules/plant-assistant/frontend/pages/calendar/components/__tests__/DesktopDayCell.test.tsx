import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CalendarDay } from '../../../../features/calendar/index.ts';
import { ALOE, FERN, IVY, plantOn } from '../../__tests__/calendarFixtures.ts';
import { calendarFormat } from '../../internal/calendarFormat.ts';
import { DesktopDayCell } from '../DesktopDayCell.tsx';

const DAY: CalendarDay = {
  date: '2026-11-24',
  inMonth: true,
  isToday: false,
  isPast: false,
  plants: [FERN, ALOE],
};

const renderCell = (day: CalendarDay = DAY) => {
  const handlers = { onOpen: vi.fn(), onShowDay: vi.fn() };

  render(
    <table>
      <tbody>
        <tr>
          <DesktopDayCell day={day} format={calendarFormat('en')} {...handlers} />
        </tr>
      </tbody>
    </table>,
  );

  return handlers;
};

describe('DesktopDayCell', () => {
  it('should name its plants, with their urgency for screen readers', () => {
    // When
    renderCell();

    // Then
    expect(
      screen.getByRole('button', { name: "Bulbasaur's fern, 3 days overdue" }),
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: "Oddish's aloe, Today" })).toBeInTheDocument();
  });

  it('should show at most three names, then how many more', () => {
    // When
    renderCell({
      ...DAY,
      plants: [FERN, ALOE, IVY, plantOn(4, 'Four', 'later', 4), plantOn(5, 'Five', 'later', 4)],
    });

    // Then
    expect(screen.getAllByRole('listitem')).toHaveLength(3);

    expect(
      screen.getByRole('button', { name: '+2 more, on Tuesday, November 24' }),
    ).toBeInTheDocument();
  });

  it('should show the whole day when more is clicked', () => {
    // Given
    const { onShowDay } = renderCell({
      ...DAY,
      plants: [FERN, ALOE, IVY, plantOn(4, 'Four', 'later', 4)],
    });

    // When
    fireEvent.click(screen.getByRole('button', { name: /^\+1 more/ }));

    // Then
    expect(onShowDay).toHaveBeenCalledWith('2026-11-24');
  });

  it('should say its date without being a button', () => {
    // When
    renderCell();

    // Then
    expect(screen.getByText('Tuesday, November 24, 2 plants to water')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Tuesday/ })).not.toBeInTheDocument();
  });

  it('should open a plant by its name', () => {
    // Given
    const { onOpen } = renderCell();

    // When
    fireEvent.click(screen.getByRole('button', { name: /^Bulbasaur's fern/ }));

    // Then
    expect(onOpen).toHaveBeenCalledWith(FERN);
  });

  it('should mark today', () => {
    // When
    renderCell({ ...DAY, isToday: true });

    // Then
    expect(screen.getByText('Tuesday, November 24, today, 2 plants to water')).toBeInTheDocument();
    expect(screen.getByText('24').parentElement).toHaveClass('ring-dex-red');
  });
});
