import { describe, expect, it } from 'vitest';
import type { PlantSummary } from '../../../../features/plants/index.ts';
import { sortByName } from '../sortByName.ts';

const plant = (id: number, name: string): PlantSummary => ({
  id,
  name,
  description: null,
  tags: [],
  photoId: null,
  lastWateredOn: '2026-11-18',
  nextWateringOn: '2026-11-25',
  daysUntil: 5,
  urgency: 'later',
});

const namesOf = (plants: PlantSummary[]) => plants.map(({ name }) => name);

describe('sortByName', () => {
  it('should sort by name in Polish alphabetical order', () => {
    // Given
    const plants = [
      plant(1, 'Żółw'),
      plant(2, 'Ćma'),
      plant(3, 'Zamiokulkas'),
      plant(4, 'Cebula'),
      plant(5, 'Aloes'),
    ];

    // When
    const sorted = sortByName(plants, 'pl');

    // Then
    expect(namesOf(sorted)).toEqual(['Aloes', 'Cebula', 'Ćma', 'Zamiokulkas', 'Żółw']);
  });

  it('should ignore case', () => {
    // Given
    const plants = [plant(1, 'monstera'), plant(2, 'Aloe'), plant(3, 'Basil')];

    // When
    const sorted = sortByName(plants, 'en');

    // Then
    expect(namesOf(sorted)).toEqual(['Aloe', 'Basil', 'monstera']);
  });

  it('should leave the given list as it is', () => {
    // Given
    const plants = [plant(1, 'Basil'), plant(2, 'Aloe')];

    // When
    sortByName(plants, 'en');

    // Then
    expect(namesOf(plants)).toEqual(['Basil', 'Aloe']);
  });
});
