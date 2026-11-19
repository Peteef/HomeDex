import type { Intervals, Season, Urgency } from './types.ts';

const FIRST_SUMMER_MONTH = 4;
const LAST_SUMMER_MONTH = 9;
const LAST_SOON_DAY = 2;
const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

const plainDate = (date: string): Temporal.PlainDate => Temporal.PlainDate.from(date);

// Temporal also accepts other ISO forms (with a time, or a six-digit year), so the shape is
// checked first.
export const isCalendarDate = (text: string): boolean => {
  if (!CALENDAR_DATE.test(text)) {
    return false;
  }

  try {
    plainDate(text);
    return true;
  } catch {
    return false;
  }
};

export const seasonOf = (date: string): Season => {
  const { month } = plainDate(date);
  return month >= FIRST_SUMMER_MONTH && month <= LAST_SUMMER_MONTH ? 'summer' : 'winter';
};

export const intervalOn = (intervals: Intervals, date: string): number =>
  seasonOf(date) === 'summer' ? intervals.summerIntervalDays : intervals.winterIntervalDays;

export const nextWateringAfter = (intervals: Intervals, wateredOn: string): string =>
  plainDate(wateredOn)
    .add({ days: intervalOn(intervals, wateredOn) })
    .toString();

export const daysBetween = (from: string, to: string): number =>
  plainDate(from).until(plainDate(to), { largestUnit: 'day' }).days;

export const urgencyOf = (daysUntil: number): Urgency => {
  if (daysUntil < 0) {
    return 'overdue';
  }

  if (daysUntil === 0) {
    return 'today';
  }

  return daysUntil <= LAST_SOON_DAY ? 'soon' : 'later';
};
