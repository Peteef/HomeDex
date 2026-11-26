import { act, fireEvent, render, screen, within } from '@testing-library/react';
import i18next from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import { BUSY_NOVEMBER, novemberWeeks, TODAY } from '../../__tests__/calendarFixtures.ts';
import { PhoneMonthGrid } from '../PhoneMonthGrid.tsx';

const renderGrid = (selected: string | null = TODAY) => {
  const onSelect = vi.fn();

  render(
    <PhoneMonthGrid weeks={novemberWeeks(BUSY_NOVEMBER)} selected={selected} onSelect={onSelect} />,
  );

  return onSelect;
};

describe('PhoneMonthGrid', () => {
  it('should head the columns with the weekdays from Monday', () => {
    // When
    renderGrid();

    // Then
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'MonMonday',
      'TueTuesday',
      'WedWednesday',
      'ThuThursday',
      'FriFriday',
      'SatSaturday',
      'SunSunday',
    ]);
  });

  it('should mark today, name its plants for screen readers and show their count', () => {
    // When
    renderGrid();

    // Then
    const today = screen.getByRole('button', {
      name: 'Friday, November 20, today, 2 plants to water',
    });

    expect(today).toHaveAttribute('aria-pressed', 'true');
    expect(today).toHaveClass('ring-dex-red');
    expect(within(today).getByText('2')).toHaveClass('bg-dex-red-soft');
  });

  it('should colour the count by the most urgent plant of the day', () => {
    // When
    renderGrid();

    // Then
    const day = screen.getByRole('button', { name: /^Tuesday, November 24/ });
    expect(within(day).getByText('5')).toHaveClass('bg-dex-green-soft');
  });

  it('should show no count on a day without plants', () => {
    // When
    renderGrid();

    // Then
    expect(screen.getByRole('button', { name: 'Wednesday, November 25' })).toHaveTextContent(/^25/);
  });

  it('should dim the days outside the month', () => {
    // When
    renderGrid();

    // Then
    expect(screen.getByRole('button', { name: 'Tuesday, December 1' })).toHaveClass(
      'text-dex-ink-muted',
    );
  });

  it('should not offer past days', () => {
    // When
    renderGrid();

    // Then
    expect(screen.queryByRole('button', { name: /November 19/ })).not.toBeInTheDocument();
    expect(screen.getByText('Thursday, November 19')).toBeInTheDocument();
  });

  it('should select a day', () => {
    // Given
    const onSelect = renderGrid();

    // When
    fireEvent.click(screen.getByRole('button', { name: /^Tuesday, November 24/ }));

    // Then
    expect(onSelect).toHaveBeenCalledWith('2026-11-24');
  });

  it('should name the days in Polish', async () => {
    // Given
    await act(() => i18next.changeLanguage('pl'));

    // When
    renderGrid();

    // Then
    expect(
      screen.getByRole('button', { name: 'piątek, 20 listopada, dziś, 2 rośliny do podlania' }),
    ).toBeInTheDocument();

    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('pon.poniedziałek');
  });
});
