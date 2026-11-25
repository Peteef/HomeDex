import { daysBetween, nextWateringAfter, urgencyOf } from '../../schedule/index.ts';
import type { Intervals, Urgency } from '../../schedule/index.ts';

export interface ScheduledPlant extends Intervals {
  nextWateringOn: string;
}

export interface ProjectedWatering {
  date: string;
  urgency: Urgency;
}

const isAfter = (date: string, other: string): boolean => daysBetween(other, date) > 0;

const wateringDatesFrom = (plant: Intervals, date: string, lastDay: string): string[] =>
  isAfter(date, lastDay)
    ? []
    : [date, ...wateringDatesFrom(plant, nextWateringAfter(plant, date), lastDay)];

// The days from today to lastDay on which the plant will need water, each with the urgency it has
// as seen from today. An overdue plant shows on today, still overdue, and its schedule continues
// from today.
export const projectWaterings = (
  plant: ScheduledPlant,
  today: string,
  lastDay: string,
): ProjectedWatering[] => {
  const isOverdue = isAfter(today, plant.nextWateringOn);

  return wateringDatesFrom(plant, isOverdue ? today : plant.nextWateringOn, lastDay).map(
    (date) => ({
      date,
      urgency: isOverdue && date === today ? 'overdue' : urgencyOf(daysBetween(today, date)),
    }),
  );
};
