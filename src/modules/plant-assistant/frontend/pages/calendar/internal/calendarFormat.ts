// A calendar date parses as midnight UTC, so it is formatted in UTC to stay on the same day.
const TIME_ZONE = 'UTC';

export interface CalendarFormat {
  monthTitle: (yearMonth: string) => string;
  fullDate: (date: string) => string;
  weekdayShort: (date: string) => string;
  weekdayLong: (date: string) => string;
  dayNumber: (date: string) => string;
}

export const calendarFormat = (language: string): CalendarFormat => {
  const formatter = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(language, { ...options, timeZone: TIME_ZONE });

  const month = formatter({ month: 'long', year: 'numeric' });
  const full = formatter({ weekday: 'long', day: 'numeric', month: 'long' });
  const short = formatter({ weekday: 'short' });
  const long = formatter({ weekday: 'long' });
  const day = formatter({ day: 'numeric' });

  return {
    monthTitle: (yearMonth) => month.format(new Date(`${yearMonth}-01`)),
    fullDate: (date) => full.format(new Date(date)),
    weekdayShort: (date) => short.format(new Date(date)),
    weekdayLong: (date) => long.format(new Date(date)),
    dayNumber: (date) => day.format(new Date(date)),
  };
};
