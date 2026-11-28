import { describe, expect, it } from 'vitest';
import type { CalendarDay, CalendarMonth, CalendarPlant } from '../index.ts';
import { findPlant } from '../index.ts';

const FERN: CalendarPlant = {
  id: 1,
  name: "Bulbasaur's fern",
  urgency: 'later',
  daysUntil: 3,
};

const day = (date: string, plants: CalendarPlant[]): CalendarDay => ({
  date,
  inMonth: true,
  isToday: false,
  isPast: false,
  plants,
});

const MONTH: CalendarMonth = {
  today: '2026-11-20',
  month: '2026-11',
  weeks: [[day('2026-11-23', []), day('2026-11-24', [FERN])]],
};

describe('findPlant', () => {
  it('should find a plant on any day of the month', () => {
    // When / Then
    expect(findPlant(MONTH, 1)).toBe(FERN);
  });

  it('should find nothing for a plant not in the month', () => {
    // When / Then
    expect(findPlant(MONTH, 2)).toBeUndefined();
  });
});
