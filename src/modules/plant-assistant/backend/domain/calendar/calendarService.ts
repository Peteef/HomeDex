import type { Storage } from '#platform/backend';
import { plantRepository } from '../plants/index.ts';
import { daysBetween } from '../schedule/index.ts';
import type { Urgency } from '../schedule/index.ts';
import { invalidMonth } from './errors.ts';
import { gridOf } from './internal/grid.ts';
import { projectWaterings } from './internal/projection.ts';
import { isYearMonth, monthOf, monthsBetween } from './internal/yearMonth.ts';
import type { CalendarMonth, CalendarPlant } from './types.ts';

const MAX_MONTHS_AHEAD = 12;
const URGENCY_ORDER: Urgency[] = ['overdue', 'today', 'soon', 'later'];

interface ProjectedPlant {
  date: string;
  plant: CalendarPlant;
}

export interface CalendarService {
  month(yearMonth?: string): CalendarMonth;
}

export interface CalendarServiceOptions {
  today: () => string;
}

const byUrgencyThenName = (a: CalendarPlant, b: CalendarPlant): number =>
  URGENCY_ORDER.indexOf(a.urgency) - URGENCY_ORDER.indexOf(b.urgency) ||
  a.name.localeCompare(b.name);

const requireShownMonth = (yearMonth: string, currentMonth: string): void => {
  if (!isYearMonth(yearMonth)) {
    throw invalidMonth(`${yearMonth} is not a month`);
  }

  const monthsAhead = monthsBetween(currentMonth, yearMonth);

  if (monthsAhead < 0 || monthsAhead > MAX_MONTHS_AHEAD) {
    throw invalidMonth(
      `${yearMonth} is not between this month and ${String(MAX_MONTHS_AHEAD)} months ahead`,
    );
  }
};

export const calendarService = (
  db: Storage,
  { today }: CalendarServiceOptions,
): CalendarService => {
  const plants = plantRepository(db);

  const projectedPlants = (day: string, lastDay: string): ProjectedPlant[] =>
    plants.list().flatMap((plant) =>
      projectWaterings(plant, day, lastDay).map(({ date, urgency, daysUntil }) => ({
        date,
        plant: { id: plant.id, name: plant.name, urgency, daysUntil },
      })),
    );

  const month = (yearMonth?: string): CalendarMonth => {
    const day = today();
    const shownMonth = yearMonth ?? monthOf(day);
    requireShownMonth(shownMonth, monthOf(day));

    const grid = gridOf(shownMonth);
    const lastDay = grid.at(-1)?.at(-1) ?? day;
    const projected = projectedPlants(day, lastDay);

    return {
      today: day,
      month: shownMonth,
      weeks: grid.map((week) =>
        week.map((date) => ({
          date,
          inMonth: monthOf(date) === shownMonth,
          isToday: date === day,
          isPast: daysBetween(day, date) < 0,
          plants: projected
            .filter((watering) => watering.date === date)
            .map(({ plant }) => plant)
            .toSorted(byUrgencyThenName),
        })),
      ),
    };
  };

  return { month };
};
