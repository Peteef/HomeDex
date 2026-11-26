import { isDue } from '../../../features/plants/index.ts';
import type { PlantSummary } from '../../../features/plants/index.ts';

type Order = (a: PlantSummary, b: PlantSummary) => number;

const soonestFirst = (language: string): Order => {
  const collator = new Intl.Collator(language);
  return (a, b) => a.daysUntil - b.daysUntil || collator.compare(a.name, b.name);
};

export const duePlants = (plants: PlantSummary[], language: string): PlantSummary[] =>
  plants.filter(isDue).toSorted(soonestFirst(language));

export const nextPlant = (plants: PlantSummary[], language: string): PlantSummary | null =>
  plants.filter((plant) => !isDue(plant)).toSorted(soonestFirst(language))[0] ?? null;
