import type { Urgency } from '../../components/urgency-label/UrgencyLabel.tsx';

export type Season = 'summer' | 'winter';

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

export interface PlantEdit {
  id: number;
  changes: PlantChanges;
}

export interface CreatedPlant {
  plant: PlantDetails;
}

export interface TagList {
  tags: string[];
}
