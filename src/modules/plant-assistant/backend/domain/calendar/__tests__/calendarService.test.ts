import path from 'node:path';
import { moduleTestStorage } from '#platform/backend/testing';
import { describe, expect, it } from 'vitest';
import { plantRepository } from '../../plants/index.ts';
import { CalendarError, calendarService } from '../index.ts';
import type { CalendarDay, CalendarMonth } from '../index.ts';

const MODULE_DIR = path.resolve(import.meta.dirname, '../../../..');

const FERN = {
  name: "Bulbasaur's fern",
  description: null,
  tags: [],
  summerIntervalDays: 7,
  winterIntervalDays: 30,
  lastWateredOn: '2026-05-27',
  nextWateringOn: '2026-06-03',
};

const newService = () => {
  const storage = moduleTestStorage(MODULE_DIR);

  return {
    service: calendarService(storage, { today: () => '2026-06-03' }),
    plants: plantRepository(storage),
  };
};

const dayOf = (calendar: CalendarMonth, date: string): CalendarDay | undefined =>
  calendar.weeks.flat().find((day) => day.date === date);

const errorOf = (action: () => unknown): CalendarError => {
  try {
    action();
  } catch (error) {
    if (error instanceof CalendarError) {
      return error;
    }

    throw error;
  }

  throw new Error('Expected a CalendarError');
};

describe('calendar service', () => {
  it('should show the current month without a month given', () => {
    // When
    const calendar = newService().service.month();

    // Then
    expect(calendar.today).toBe('2026-06-03');
    expect(calendar.month).toBe('2026-06');
    expect(calendar.weeks).toHaveLength(5);
  });

  it('should mark the days of the month, today and the past', () => {
    // When
    const calendar = newService().service.month('2026-06');

    // Then
    expect(dayOf(calendar, '2026-06-02')).toEqual({
      date: '2026-06-02',
      inMonth: true,
      isToday: false,
      isPast: true,
      plants: [],
    });

    expect(dayOf(calendar, '2026-06-03')).toMatchObject({ isToday: true, isPast: false });
    expect(dayOf(calendar, '2026-07-01')).toMatchObject({ inMonth: false, isPast: false });
  });

  it('should place each projected watering of a plant on its day', () => {
    // Given
    const { service, plants } = newService();
    const id = plants.insert(FERN);

    // When
    const calendar = service.month('2026-06');

    // Then
    expect(dayOf(calendar, '2026-06-03')?.plants).toEqual([
      { id, name: "Bulbasaur's fern", urgency: 'today', daysUntil: 0 },
    ]);

    expect(dayOf(calendar, '2026-06-10')?.plants).toEqual([
      { id, name: "Bulbasaur's fern", urgency: 'later', daysUntil: 7 },
    ]);

    expect(dayOf(calendar, '2026-06-04')?.plants).toEqual([]);
  });

  it('should leave past days empty for an overdue plant', () => {
    // Given
    const { service, plants } = newService();
    plants.insert({ ...FERN, nextWateringOn: '2026-06-01' });

    // When
    const calendar = service.month('2026-06');

    // Then
    expect(dayOf(calendar, '2026-06-01')?.plants).toEqual([]);

    expect(dayOf(calendar, '2026-06-03')?.plants).toMatchObject([
      { urgency: 'overdue', daysUntil: -2 },
    ]);
  });

  it('should order the plants of a day by urgency, then by name', () => {
    // Given
    const { service, plants } = newService();
    plants.insert({ ...FERN, name: "Oddish's ivy" });
    plants.insert({ ...FERN, name: "Zubat's moss", nextWateringOn: '2026-06-01' });
    plants.insert({ ...FERN, name: "Abra's aloe" });

    // When
    const calendar = service.month('2026-06');

    // Then
    expect(dayOf(calendar, '2026-06-03')?.plants.map(({ name }) => name)).toEqual([
      "Zubat's moss",
      "Abra's aloe",
      "Oddish's ivy",
    ]);
  });

  it('should show a month 12 months ahead', () => {
    // When
    const calendar = newService().service.month('2027-06');

    // Then
    expect(calendar.month).toBe('2027-06');
  });

  it.each(['2026-05', '2027-07', '2026-13', 'june'])('should refuse %s', (month) => {
    // Given
    const { service } = newService();

    // When / Then
    expect(errorOf(() => service.month(month)).code).toBe('invalid');
  });
});
