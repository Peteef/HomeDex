import { useEffect, useState } from 'react';
import { partOfDayAt, timeOfDayAt } from './timeOfDay.ts';

const untilNextHour = (date: Date): number => {
  const nextHour = new Date(date);
  nextHour.setHours(date.getHours() + 1, 0, 0, 0);
  return nextHour.getTime() - date.getTime();
};

// Every boundary is on a full hour, so checking at each full hour is enough. A phone pauses
// timers while the app is in the background, so it checks again when the app comes back.
export const useTimeOfDay = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const refresh = () => {
      setNow(new Date());
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    const timer = setTimeout(refresh, untilNextHour(now));
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [now]);

  return {
    timeOfDay: timeOfDayAt(now),
    partOfDay: partOfDayAt(now),
  };
};
