import { foldText } from '#platform/shared';
import type { PlantSummary } from '../../../features/plants/index.ts';

export interface PlantFilter {
  query: string;
  tag: string | null;
}

const WORD_SEPARATOR = /\s+/;

const wordsOf = (query: string): string[] =>
  foldText(query)
    .split(WORD_SEPARATOR)
    .filter((word) => word !== '');

const searchableText = ({ name, description, tags }: PlantSummary): string =>
  foldText([name, description ?? '', ...tags].join(' '));

const matchesTag = (plant: PlantSummary, tag: string | null): boolean =>
  tag === null || plant.tags.some((plantTag) => foldText(plantTag) === foldText(tag));

const matchesQuery = (plant: PlantSummary, words: string[]): boolean => {
  const text = searchableText(plant);
  return words.every((word) => text.includes(word));
};

export const filterPlants = (
  plants: PlantSummary[],
  { query, tag }: PlantFilter,
): PlantSummary[] => {
  const words = wordsOf(query);
  return plants.filter((plant) => matchesTag(plant, tag) && matchesQuery(plant, words));
};
