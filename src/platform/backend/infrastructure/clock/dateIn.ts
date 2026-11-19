const DATE_PARTS = { year: 'numeric', month: '2-digit', day: '2-digit' } as const;
// Only the parts are read, so the locale just has to write Latin digits.
const PARTS_LOCALE = 'en';

const partOf = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string =>
  parts.find((part) => part.type === type)?.value ?? '';

// The calendar date of an instant in a time zone, as YYYY-MM-DD: 2026-03-31T22:30:00Z is still
// 2026-03-31 in UTC but already 2026-04-01 in Europe/Warsaw.
export const dateIn = (timeZone: string, instant: number): string => {
  const format = new Intl.DateTimeFormat(PARTS_LOCALE, { timeZone, ...DATE_PARTS });
  const parts = format.formatToParts(instant);
  return `${partOf(parts, 'year')}-${partOf(parts, 'month')}-${partOf(parts, 'day')}`;
};
