import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { CalendarDay } from '../../../../features/calendar/index.ts';
import { ALOE, FERN, IVY } from '../../__tests__/calendarFixtures.ts';
import { calendarFormat } from '../../internal/calendarFormat.ts';
import { PhoneDayCell } from '../PhoneDayCell.tsx';

const DAY: CalendarDay = {
  date: '2026-11-24',
  inMonth: true,
  isToday: false,
  isPast: false,
  plants: [],
};

const inRow = (cell: ReactNode) => (
  <table>
    <tbody>
      <tr>{cell}</tr>
    </tbody>
  </table>
);

const renderCell = (day: CalendarDay, selected = false) => {
  const onSelect = vi.fn();

  render(
    inRow(
      <PhoneDayCell
        day={day}
        selected={selected}
        format={calendarFormat('en')}
        onSelect={onSelect}
      />,
    ),
  );

  return onSelect;
};

describe('PhoneDayCell', () => {
  it('should mark today and the selected day', () => {
    // When
    renderCell({ ...DAY, isToday: true }, true);

    // Then
    const day = screen.getByRole('button', { name: /^Tuesday, November 24, today/ });
    expect(day).toHaveClass('ring-dex-red');
    expect(day).toHaveAttribute('aria-pressed', 'true');
  });

  it('should count the plants, coloured by the most urgent one', () => {
    // When
    renderCell({ ...DAY, plants: [FERN, ALOE] });

    // Then
    const day = screen.getByRole('button', { name: /2 plants to water/ });
    expect(within(day).getByText('2')).toHaveClass('bg-dex-red-soft');
  });

  it('should show no count on a day without plants', () => {
    // When
    renderCell(DAY);

    // Then
    expect(screen.getByRole('button', { name: 'Tuesday, November 24' })).toHaveTextContent(
      /^24Tuesday/,
    );
  });

  it('should dim a day outside the month', () => {
    // When
    renderCell({ ...DAY, inMonth: false, plants: [IVY] });

    // Then
    expect(screen.getByRole('button', { name: /^Tuesday, November 24/ })).toHaveClass(
      'text-dex-ink-muted',
    );
  });

  it('should select the day', () => {
    // Given
    const onSelect = renderCell(DAY);

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Tuesday, November 24' }));

    // Then
    expect(onSelect).toHaveBeenCalledWith('2026-11-24');
  });
});
