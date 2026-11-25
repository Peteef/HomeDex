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
