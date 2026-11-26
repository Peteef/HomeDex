const MONTHS_IN_YEAR = 12;
const MONTH_DIGITS = 2;
const YEAR_MONTH_LENGTH = 'YYYY-MM'.length;

// Month arithmetic on "YYYY-MM" text; dates themselves stay with the server.
export const addMonths = (yearMonth: string, months: number): string => {
  const [year = 0, month = 1] = yearMonth.split('-').map(Number);
  const index = year * MONTHS_IN_YEAR + (month - 1) + months;
  const shownMonth = String((index % MONTHS_IN_YEAR) + 1).padStart(MONTH_DIGITS, '0');
  return `${String(Math.floor(index / MONTHS_IN_YEAR))}-${shownMonth}`;
};

export const monthOf = (date: string): string => date.slice(0, YEAR_MONTH_LENGTH);
