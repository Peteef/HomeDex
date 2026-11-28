// Temporal numbers the days of the week from Monday (1) to Sunday (7).
const MONDAY = 1;
const SUNDAY = 7;
const DAYS_IN_WEEK = 7;

// The month's days as whole weeks, Monday to Sunday: the first week starts on the Monday on or
// before the 1st and the last ends on the Sunday on or after the month's last day, so the first
// and last weeks may hold days of the months around it. June 2026 (the 1st is a Monday) gives
// [['2026-06-01', ..., '2026-06-07'], ..., ['2026-06-29', ..., '2026-07-05']].
export const gridOf = (yearMonth: string): string[][] => {
  const month = Temporal.PlainYearMonth.from(yearMonth);
  const firstOfMonth = month.toPlainDate({ day: 1 });
  const lastOfMonth = month.toPlainDate({ day: month.daysInMonth });
  const firstMonday = firstOfMonth.subtract({ days: firstOfMonth.dayOfWeek - MONDAY });
  const lastSunday = lastOfMonth.add({ days: SUNDAY - lastOfMonth.dayOfWeek });
  const weekCount = (firstMonday.until(lastSunday).days + 1) / DAYS_IN_WEEK;

  return Array.from({ length: weekCount }, (_week, week) =>
    Array.from({ length: DAYS_IN_WEEK }, (_day, day) =>
      firstMonday.add({ days: week * DAYS_IN_WEEK + day }).toString(),
    ),
  );
};
