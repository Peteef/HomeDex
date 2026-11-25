const YEAR_MONTH = /^\d{4}-\d{2}$/;

// Temporal also accepts other forms (a full date, or a six-digit year), so the shape is checked
// first.
export const isYearMonth = (text: string): boolean => {
  if (!YEAR_MONTH.test(text)) {
    return false;
  }

  try {
    Temporal.PlainYearMonth.from(text);
    return true;
  } catch {
    return false;
  }
};

export const monthOf = (date: string): string =>
  Temporal.PlainDate.from(date).toPlainYearMonth().toString();

export const monthsBetween = (from: string, to: string): number =>
  Temporal.PlainYearMonth.from(from).until(Temporal.PlainYearMonth.from(to), {
    largestUnit: 'months',
  }).months;
