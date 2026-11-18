import type { PartOfDay, TimeOfDay } from './types.ts';

const DAY_STARTS_AT = 7;
const NIGHT_STARTS_AT = 21;

const MORNING_STARTS_AT = 5;
const AFTERNOON_STARTS_AT = 12;
const EVENING_STARTS_AT = 18;
const LATE_NIGHT_STARTS_AT = 23;

const TIME_OF_DAY_ATTRIBUTE = 'data-time-of-day';

export const timeOfDayAt = (date: Date): TimeOfDay => {
  const hour = date.getHours();
  return hour >= DAY_STARTS_AT && hour < NIGHT_STARTS_AT ? 'day' : 'night';
};

export const partOfDayAt = (date: Date): PartOfDay => {
  const hour = date.getHours();

  if (hour < MORNING_STARTS_AT || hour >= LATE_NIGHT_STARTS_AT) {
    return 'night';
  }

  if (hour < AFTERNOON_STARTS_AT) {
    return 'morning';
  }

  return hour < EVENING_STARTS_AT ? 'afternoon' : 'evening';
};

// The night colours in index.css hang off this attribute on the root element.
export const applyTimeOfDay = (timeOfDay: TimeOfDay): void => {
  document.documentElement.setAttribute(TIME_OF_DAY_ATTRIBUTE, timeOfDay);
};
