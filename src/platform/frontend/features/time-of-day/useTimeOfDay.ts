import { useEffect, useState } from 'react';
import { currentTime } from './internal/clock.ts';
import { partOfDayAt, themeAt } from './timeOfDay.ts';

const untilNextHour = (date: Date): number => {
  const nextHour = new Date(date);
  nextHour.setHours(date.getHours() + 1, 0, 0, 0);
  return nextHour.getTime() - date.getTime();
};

// Every boundary is on a full hour, so checking at each full hour is enough. A phone pauses
// timers while the app is in the background, so it checks again when the app comes back.
export const useTimeOfDay = () => {
  const [now, setNow] = useState(currentTime);

  useEffect(() => {
    const refresh = () => {
      setNow(currentTime());
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
    theme: themeAt(now),
    partOfDay: partOfDayAt(now),
  };
};
