import type { Season, Urgency } from '../schedule/index.ts';

export interface PlantFields {
  name: string;
  description: string | null;
  tags: string[];
  summerIntervalDays: number;
  winterIntervalDays: number;
}

// A photo is base64 JPEG text. Left out, the current photo stays; null removes it.
export interface PhotoInput {
  photo?: string | null;
}

export interface NewPlant extends PlantFields, PhotoInput {
  lastWateredOn: string;
}

export interface PlantChanges extends PlantFields, PhotoInput {
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
