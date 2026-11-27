import type { CalendarDay, CalendarPlant } from '../../../features/calendar/index.ts';

const NOVEMBER_DATES = [
  [
    '2026-11-16',
    '2026-11-17',
    '2026-11-18',
    '2026-11-19',
    '2026-11-20',
    '2026-11-21',
    '2026-11-22',
  ],
  [
    '2026-11-23',
    '2026-11-24',
    '2026-11-25',
    '2026-11-26',
    '2026-11-27',
    '2026-11-28',
    '2026-11-29',
  ],
  [
    '2026-11-30',
    '2026-12-01',
    '2026-12-02',
    '2026-12-03',
    '2026-12-04',
    '2026-12-05',
    '2026-12-06',
  ],
];

export const TODAY = '2026-11-20';

export const plantOn = (
  id: number,
  name: string,
  urgency: CalendarPlant['urgency'],
  daysUntil: number,
): CalendarPlant => ({
  id,
  name,
  urgency,
  daysUntil,
});

export const FERN = plantOn(1, "Bulbasaur's fern", 'overdue', -3);
export const ALOE = plantOn(2, "Oddish's aloe", 'today', 0);
export const IVY = plantOn(3, "Tangela's ivy", 'later', 4);

// Three weeks around 20 November 2026, a Friday: the fern overdue and the aloe due today, the
// ivy and four others on the 24th.
export const novemberWeeks = (plantsOn: Record<string, CalendarPlant[]> = {}): CalendarDay[][] =>
  NOVEMBER_DATES.map((week) =>
    week.map((date) => ({
      date,
      inMonth: date.startsWith('2026-11'),
      isToday: date === TODAY,
      isPast: date < TODAY,
      plants: plantsOn[date] ?? [],
    })),
  );

export const BUSY_NOVEMBER = {
  [TODAY]: [FERN, ALOE],
  '2026-11-24': [
    IVY,
    plantOn(4, "Cacnea's cactus", 'later', 4),
    plantOn(5, "Exeggcute's palm", 'later', 4),
    plantOn(6, "Gloom's orchid", 'later', 4),
    plantOn(7, "Paras's moss", 'later', 4),
  ],
};
