import type { PlantDates } from '../plants/index.ts';

export interface Watering {
  wateringId: number;
  previous: PlantDates;
}

export type WateringErrorCode = 'invalid' | 'not_found' | 'conflict';
