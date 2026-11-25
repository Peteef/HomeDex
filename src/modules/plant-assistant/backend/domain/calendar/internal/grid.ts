const MONDAY = 1;
const DAYS_IN_WEEK = 7;

const daysSinceWeekStart = (date: Temporal.PlainDate): number =>
  (date.dayOfWeek - MONDAY + DAYS_IN_WEEK) % DAYS_IN_WEEK;

// The whole weeks around the month, Monday to Sunday, as dates.
export const gridOf = (yearMonth: string): string[][] => {
  const month = Temporal.PlainYearMonth.from(yearMonth);
  const firstDay = month.toPlainDate({ day: 1 });
  const lastDay = month.toPlainDate({ day: month.daysInMonth });
  const start = firstDay.subtract({ days: daysSinceWeekStart(firstDay) });
  const end = lastDay.add({ days: DAYS_IN_WEEK - 1 - daysSinceWeekStart(lastDay) });
  const weekCount = (start.until(end).days + 1) / DAYS_IN_WEEK;

  return Array.from({ length: weekCount }, (_week, week) =>
    Array.from({ length: DAYS_IN_WEEK }, (_day, day) =>
      start.add({ days: week * DAYS_IN_WEEK + day }).toString(),
    ),
  );
};
