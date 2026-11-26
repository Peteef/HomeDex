import { describe, expect, it } from 'vitest';
import type { PlantSummary } from '../../../../features/plants/index.ts';
import { duePlants, nextPlant } from '../duePlants.ts';

const plant = (id: number, name: string, daysUntil: number): PlantSummary => ({
  id,
  name,
  description: null,
  tags: [],
  photoId: null,
  lastWateredOn: '2026-11-10',
  nextWateringOn: '2026-11-20',
  daysUntil,
  urgency: daysUntil < 0 ? 'overdue' : 'later',
});

const namesOf = (plants: PlantSummary[]) => plants.map(({ name }) => name);

describe('duePlants', () => {
  it('should keep the plants due today or overdue, most overdue first', () => {
    // Given
    const plants = [
      plant(1, 'Today', 0),
      plant(2, 'Later', 2),
      plant(3, 'Long overdue', -5),
      plant(4, 'Overdue', -1),
    ];

    // When / Then
    expect(namesOf(duePlants(plants, 'en'))).toEqual(['Long overdue', 'Overdue', 'Today']);
  });

  it('should order plants due on the same day by name in the current language', () => {
    // Given
    const plants = [plant(1, 'Żółw', 0), plant(2, 'Zebra', 0), plant(3, 'Aloe', 0)];

    // When / Then
    expect(namesOf(duePlants(plants, 'pl'))).toEqual(['Aloe', 'Zebra', 'Żółw']);
  });
});

describe('nextPlant', () => {
  it('should find the plant due soonest after today', () => {
    // Given
    const plants = [plant(1, 'Overdue', -1), plant(2, 'Later', 9), plant(3, 'Tomorrow', 1)];

    // When / Then
    expect(nextPlant(plants, 'en')?.name).toBe('Tomorrow');
  });

  it('should find nothing when no plant is due later', () => {
    // When / Then
    expect(nextPlant([plant(1, 'Today', 0)], 'en')).toBeNull();
  });
});
