import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BUSY_NOVEMBER, FERN, novemberWeeks, TODAY } from '../../__tests__/calendarFixtures.ts';
import { DesktopMonthGrid } from '../DesktopMonthGrid.tsx';

const renderGrid = () => {
  const handlers = { onSelect: vi.fn(), onOpen: vi.fn() };

  render(<DesktopMonthGrid weeks={novemberWeeks(BUSY_NOVEMBER)} selected={TODAY} {...handlers} />);

  return handlers;
};

const cellOf = (dayName: RegExp) =>
  screen.getByRole('button', { name: dayName }).closest('td') ?? document.body;

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

  it('should select the day with its number or with more', () => {
    // Given
    const { onSelect } = renderGrid();

    // When
    fireEvent.click(screen.getByRole('button', { name: /^Tuesday, November 24/ }));
    fireEvent.click(screen.getByRole('button', { name: /^\+2 more/ }));

    // Then
    expect(onSelect.mock.calls).toEqual([['2026-11-24'], ['2026-11-24']]);
  });

  it('should open a plant by its name', () => {
    // Given
    const { onOpen } = renderGrid();

    // When
    fireEvent.click(screen.getByRole('button', { name: /^Bulbasaur's fern/ }));

    // Then
    expect(onOpen).toHaveBeenCalledWith(FERN);
  });

  it('should mark today and the selected day', () => {
    // When
    renderGrid();

    // Then
    const today = screen.getByRole('button', { name: /^Friday, November 20, today/ });
    expect(today).toHaveClass('ring-dex-red');
    expect(today).toHaveAttribute('aria-pressed', 'true');
  });

  it('should not offer past days', () => {
    // When
    renderGrid();

    // Then
    expect(screen.queryByRole('button', { name: /November 16/ })).not.toBeInTheDocument();
  });
});
