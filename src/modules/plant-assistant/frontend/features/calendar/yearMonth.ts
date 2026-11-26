const YEAR_MONTH_LENGTH = 'YYYY-MM'.length;

// Date.UTC carries a month past December into the next year, and one before January into the
// previous year.
export const addMonths = (yearMonth: string, months: number): string => {
  const [year = 0, month = 1] = yearMonth.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1 + months)).toISOString().slice(0, YEAR_MONTH_LENGTH);
};

export const nextMonth = (yearMonth: string): string => addMonths(yearMonth, 1);

export const previousMonth = (yearMonth: string): string => addMonths(yearMonth, -1);

export const monthOf = (date: string): string => date.slice(0, YEAR_MONTH_LENGTH);
