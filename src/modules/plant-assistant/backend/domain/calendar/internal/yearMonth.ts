const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export const isYearMonth = (text: string): boolean => YEAR_MONTH.test(text);

export const monthOf = (date: string): string =>
  Temporal.PlainDate.from(date).toPlainYearMonth().toString();

export const monthsBetween = (from: string, to: string): number =>
  Temporal.PlainYearMonth.from(from).until(Temporal.PlainYearMonth.from(to), {
    largestUnit: 'months',
  }).months;
