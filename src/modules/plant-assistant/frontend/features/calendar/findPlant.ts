import type { CalendarMonth, CalendarPlant } from './types.ts';

export const findPlant = ({ weeks }: CalendarMonth, id: number): CalendarPlant | undefined =>
  weeks
    .flat()
    .flatMap((day) => day.plants)
    .find((plant) => plant.id === id);
