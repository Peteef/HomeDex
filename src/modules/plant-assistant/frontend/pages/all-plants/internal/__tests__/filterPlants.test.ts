import { describe, expect, it } from 'vitest';
import type { PlantSummary } from '../../../../features/plants/index.ts';
import { filterPlants } from '../filterPlants.ts';

const plant = (id: number, name: string, overrides: Partial<PlantSummary> = {}): PlantSummary => ({
  id,
  name,
  description: null,
  tags: [],
  photoId: null,
  lastWateredOn: '2026-11-18',
  nextWateringOn: '2026-11-25',
  daysUntil: 5,
  urgency: 'later',
  ...overrides,
});

const FERN = plant(1, "Bulbasaur's fern", {
  description: 'Likes shade.',
  tags: ['Living room', 'Shade'],
});

const CACTUS = plant(2, "Cacnea's cactus", { tags: ['Windowsill'] });
const TURTLE = plant(3, 'Żółw plant', { tags: ['Łazienka'] });
const PLANTS = [FERN, CACTUS, TURTLE];

const namesOf = (plants: PlantSummary[]) => plants.map(({ name }) => name);

describe('filterPlants', () => {
  it('should return every plant when there is no query and no tag', () => {
    // When / Then
    expect(filterPlants(PLANTS, { query: '  ', tag: null })).toEqual(PLANTS);
  });

  it('should find plants by name', () => {
    // When / Then
    expect(namesOf(filterPlants(PLANTS, { query: 'cactus', tag: null }))).toEqual([
      "Cacnea's cactus",
    ]);
  });

  it('should find plants by description', () => {
    // When / Then
    expect(namesOf(filterPlants(PLANTS, { query: 'likes', tag: null }))).toEqual([
      "Bulbasaur's fern",
    ]);
  });

  it('should find plants by the text of their tags', () => {
    // When / Then
    expect(namesOf(filterPlants(PLANTS, { query: 'window', tag: null }))).toEqual([
      "Cacnea's cactus",
    ]);
  });

  it('should ignore case and Polish diacritics', () => {
    // When / Then
    expect(namesOf(filterPlants(PLANTS, { query: 'ZOLW lazienka', tag: null }))).toEqual([
      'Żółw plant',
    ]);
  });

  it('should find only plants that match every word', () => {
    // When / Then
    expect(namesOf(filterPlants(PLANTS, { query: 'fern cactus', tag: null }))).toEqual([]);
  });

  it('should keep only the plants with the tag, whatever its case and diacritics', () => {
    // When / Then
    expect(namesOf(filterPlants(PLANTS, { query: '', tag: 'lazienka' }))).toEqual(['Żółw plant']);
  });

  it('should not match a tag by part of its text', () => {
    // When / Then
    expect(filterPlants(PLANTS, { query: '', tag: 'Living' })).toEqual([]);
  });

  it('should combine the tag and the query', () => {
    // Given
    const shadyCactus = plant(4, 'Shady cactus', { tags: ['Shade'] });

    // When / Then
    expect(
      namesOf(filterPlants([...PLANTS, shadyCactus], { query: 'cactus', tag: 'Shade' })),
    ).toEqual(['Shady cactus']);
  });
});
