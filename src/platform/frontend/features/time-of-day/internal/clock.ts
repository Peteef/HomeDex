import { devParam } from '../../../lib/dev-params/index.ts';

const HOUR_PATTERN = /^\d{1,2}$/;
const HOURS_IN_DAY = 24;

const parseHour = (raw: string): number | null => {
  const hour = Number(raw);
  return HOUR_PATTERN.test(raw) && hour < HOURS_IN_DAY ? hour : null;
};

const devHour = devParam('hour', parseHour);

export const currentTime = (): Date => {
  const now = new Date();
  const hour = devHour();

  if (hour !== null) {
    now.setHours(hour, 0, 0, 0);
  }

  return now;
};
