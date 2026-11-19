import type { Season, Urgency } from '../schedule/index.ts';

export interface PlantFields {
  name: string;
  description: string | null;
  tags: string[];
  summerIntervalDays: number;
  winterIntervalDays: number;
}

export interface NewPlant extends PlantFields {
  lastWateredOn: string;
}

export interface PlantChanges extends PlantFields {
  nextWateringOn: string;
}

export interface PlantSummary {
  id: number;
  name: string;
  description: string | null;
  tags: string[];
  photoId: number | null;
  lastWateredOn: string;
  nextWateringOn: string;
  daysUntil: number;
  urgency: Urgency;
}

export interface PlantDetails extends PlantSummary {
  summerIntervalDays: number;
  winterIntervalDays: number;
  currentSeason: Season;
}

export interface PlantList {
  today: string;
  plants: PlantSummary[];
}

export interface PlantView {
  today: string;
  plant: PlantDetails;
}

export type PlantErrorCode = 'invalid' | 'not_found';
