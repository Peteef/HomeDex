import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BUSY_NOVEMBER, FERN, novemberWeeks } from '../../__tests__/calendarFixtures.ts';
import { DesktopMonthGrid } from '../DesktopMonthGrid.tsx';

const renderGrid = () => {
  const handlers = { onOpen: vi.fn(), onShowDay: vi.fn() };

  render(<DesktopMonthGrid weeks={novemberWeeks(BUSY_NOVEMBER)} {...handlers} />);

  return handlers;
};

const cellOf = (dayName: RegExp) => screen.getByText(dayName).closest('td') ?? document.body;

describe('DesktopMonthGrid', () => {
  it('should show the names of the plants in their day, with their urgency for screen readers', () => {
    // When
    renderGrid();

    // Then
    const today = within(cellOf(/^Friday, November 20/));

    expect(
      today.getByRole('button', { name: "Bulbasaur's fern, 3 days overdue" }),
    ).toBeInTheDocument();

    expect(today.getByRole('button', { name: "Oddish's aloe, Today" })).toBeInTheDocument();
  });

  it('should show at most three names, then how many more', () => {
    // When
    renderGrid();

    // Then
    const day = within(cellOf(/^Tuesday, November 24/));
    expect(day.getAllByRole('listitem')).toHaveLength(3);

    expect(
      day.getByRole('button', { name: '+2 more, on Tuesday, November 24' }),
    ).toBeInTheDocument();
  });

  it('should show a whole day with more', () => {
    // Given
    const { onShowDay } = renderGrid();

    // When
    fireEvent.click(screen.getByRole('button', { name: /^\+2 more/ }));

    // Then
    expect(onShowDay).toHaveBeenCalledWith('2026-11-24');
  });

  it('should open a plant by its name', () => {
    // Given
    const { onOpen } = renderGrid();

    // When
    fireEvent.click(screen.getByRole('button', { name: /^Bulbasaur's fern/ }));

    // Then
    expect(onOpen).toHaveBeenCalledWith(FERN);
  });

  it('should mark today', () => {
    // When
    renderGrid();

    // Then
    expect(screen.getByText(/^Friday, November 20, today/).parentElement).toHaveClass(
      'ring-dex-red',
    );
  });

  it('should offer nothing to click on past days', () => {
    // When
    renderGrid();

    // Then
    expect(within(cellOf(/^Monday, November 16/)).queryAllByRole('button')).toHaveLength(0);
  });
});
