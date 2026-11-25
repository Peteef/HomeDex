import type { PlantSummary } from '../../../features/plants/index.ts';

export const sortByName = (plants: readonly PlantSummary[], language: string): PlantSummary[] => {
  const collator = new Intl.Collator(language);
  return [...plants].sort((a, b) => collator.compare(a.name, b.name));
};
