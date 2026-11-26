import { describe, expect, it } from 'vitest';
import type { PlantSummary } from '../index.ts';
import { isDue } from '../index.ts';

const plantDueIn = (daysUntil: number): PlantSummary => ({
  id: 1,
  name: "Bulbasaur's fern",
  description: null,
  tags: [],
  photoId: null,
  lastWateredOn: '2026-11-18',
  nextWateringOn: '2026-11-25',
  daysUntil,
  urgency: 'later',
});

describe('isDue', () => {
  it.each([-3, 0])('should be due %s days from today', (daysUntil) => {
    // When / Then
    expect(isDue(plantDueIn(daysUntil))).toBe(true);
  });

  it('should not be due tomorrow', () => {
    // When / Then
    expect(isDue(plantDueIn(1))).toBe(false);
  });
});
