import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CalendarDay } from '../../../../features/calendar/index.ts';
import { ALOE, FERN } from '../../__tests__/calendarFixtures.ts';
import { DayDialog } from '../DayDialog.tsx';

const DAY: CalendarDay = {
  date: '2026-11-24',
  inMonth: true,
  isToday: false,
  isPast: false,
  plants: [FERN, ALOE],
};

const renderDialog = () => {
  const handlers = { onOpen: vi.fn(), onClose: vi.fn() };
  render(<DayDialog day={DAY} {...handlers} />);
  return handlers;
};

describe('DayDialog', () => {
  it("should be titled with the day's date and list its plants", () => {
    // When
    renderDialog();

    // Then
    const dialog = screen.getByRole('dialog', { name: 'Tuesday, November 24' });
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(2);
  });

  it('should open a plant', () => {
    // Given
    const { onOpen } = renderDialog();

    // When
    fireEvent.click(screen.getByRole('button', { name: /^Oddish's aloe/ }));

    // Then
    expect(onOpen).toHaveBeenCalledWith(ALOE);
  });

  it('should close', () => {
    // Given
    const { onClose } = renderDialog();

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    // Then
    expect(onClose).toHaveBeenCalled();
  });
});
