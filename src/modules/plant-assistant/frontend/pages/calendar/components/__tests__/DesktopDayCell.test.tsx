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

const renderCell = (day: CalendarDay = DAY, selected = false) => {
  const handlers = { onSelect: vi.fn(), onOpen: vi.fn() };

  render(
    <table>
      <tbody>
        <tr>
          <DesktopDayCell
            day={day}
            selected={selected}
            format={calendarFormat('en')}
            {...handlers}
          />
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

  it('should select the day with its number', () => {
    // Given
    const { onSelect } = renderCell();

    // When
    fireEvent.click(screen.getByRole('button', { name: /^Tuesday, November 24/ }));

    // Then
    expect(onSelect).toHaveBeenCalledWith('2026-11-24');
  });

  it('should open a plant by its name', () => {
    // Given
    const { onOpen } = renderCell();

    // When
    fireEvent.click(screen.getByRole('button', { name: /^Bulbasaur's fern/ }));

    // Then
    expect(onOpen).toHaveBeenCalledWith(FERN);
  });

  it('should mark today and the selected day', () => {
    // When
    renderCell({ ...DAY, isToday: true }, true);

    // Then
    const day = screen.getByRole('button', { name: /^Tuesday, November 24, today/ });
    expect(day).toHaveClass('ring-dex-red');
    expect(day).toHaveAttribute('aria-pressed', 'true');
  });
});
