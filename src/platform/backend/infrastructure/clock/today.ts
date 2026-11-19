// Only the parts are read, so the locale just has to write Latin digits.
const PARTS_LOCALE = 'en';
const DATE_PARTS = { year: 'numeric', month: '2-digit', day: '2-digit' } as const;

const partOf = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string =>
  parts.find((part) => part.type === type)?.value ?? '';

export const todayIn = (timeZone: string, now: () => number): (() => string) => {
  const format = new Intl.DateTimeFormat(PARTS_LOCALE, { timeZone, ...DATE_PARTS });

  const today = (): string => {
    const parts = format.formatToParts(now());
    return `${partOf(parts, 'year')}-${partOf(parts, 'month')}-${partOf(parts, 'day')}`;
  };

  return today;
};
