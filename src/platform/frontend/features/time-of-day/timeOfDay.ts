import type { Theme } from '../../lib/theme/index.ts';
import type { PartOfDay } from './types.ts';

// Periods by start hour, from midnight on; each one lasts until the next starts.
type Schedule<T> = readonly [{ from: 0; value: T }, ...{ from: number; value: T }[]];

const THEME_SCHEDULE: Schedule<Theme> = [
  { from: 0, value: 'night' },
  { from: 7, value: 'day' },
  { from: 21, value: 'night' },
];

const PART_OF_DAY_SCHEDULE: Schedule<PartOfDay> = [
  { from: 0, value: 'night' },
  { from: 7, value: 'morning' },
  { from: 12, value: 'afternoon' },
  { from: 19, value: 'evening' },
  { from: 23, value: 'night' },
];

const valueAt = <T>([midnight, ...later]: Schedule<T>, date: Date): T => {
  const hour = date.getHours();
  return later.findLast(({ from }) => from <= hour)?.value ?? midnight.value;
};

export const themeAt = (date: Date): Theme => valueAt(THEME_SCHEDULE, date);

export const partOfDayAt = (date: Date): PartOfDay => valueAt(PART_OF_DAY_SCHEDULE, date);
