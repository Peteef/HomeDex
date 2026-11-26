export interface PlantDates {
  lastWateredOn: string;
  nextWateringOn: string;
}

export interface Watering {
  wateringId: number;
  previous: PlantDates;
}

export interface WateringUndo extends Watering {
  plantId: number;
}

export interface Postponement {
  plantId: number;
  days: number;
}
