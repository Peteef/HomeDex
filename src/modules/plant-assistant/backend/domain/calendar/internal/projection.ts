import { daysBetween, nextWateringAfter, urgencyOf } from '../../schedule/index.ts';
import type { Intervals, Urgency } from '../../schedule/index.ts';

export interface ScheduledPlant extends Intervals {
  nextWateringOn: string;
}

export interface ProjectedWatering {
  date: string;
  urgency: Urgency;
}

// An overdue plant is shown on today, still overdue, and its schedule continues from today.
export const projectWaterings = (
  plant: ScheduledPlant,
  today: string,
  lastDay: string,
): ProjectedWatering[] => {
  const isOverdue = daysBetween(today, plant.nextWateringOn) < 0;
  const waterings: ProjectedWatering[] = [];

  for (
    let date = isOverdue ? today : plant.nextWateringOn;
    daysBetween(date, lastDay) >= 0;
    date = nextWateringAfter(plant, date)
  ) {
    waterings.push({
      date,
      urgency: isOverdue && date === today ? 'overdue' : urgencyOf(daysBetween(today, date)),
    });
  }

  return waterings;
};
