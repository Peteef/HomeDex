import { fakeApi, ok } from '#platform/frontend/testing';
import { describe, expect, it } from 'vitest';
import { fetchPlant, fetchPlants } from '../plantsApi.ts';

const FERN = {
  id: 1,
  name: "Bulbasaur's fern",
  description: null,
  tags: [],
  photoId: null,
  lastWateredOn: '2026-11-18',
  nextWateringOn: '2026-11-25',
  daysUntil: 5,
  urgency: 'later',
};

const FERN_DETAILS = {
  ...FERN,
  summerIntervalDays: 7,
  winterIntervalDays: 14,
  currentSeason: 'winter',
};

describe('plants API', () => {
  it('should fetch the plants with today', async () => {
    // Given
    fakeApi({ 'GET /api/m/plant-assistant/plants': ok({ today: '2026-11-20', plants: [FERN] }) });

    // When / Then
    expect(await fetchPlants()).toEqual({ today: '2026-11-20', plants: [FERN] });
  });

  it('should fetch one plant with today', async () => {
    // Given
    fakeApi({
      'GET /api/m/plant-assistant/plants/1': ok({ today: '2026-11-20', plant: FERN_DETAILS }),
    });

    // When / Then
    expect(await fetchPlant(1)).toEqual({ today: '2026-11-20', plant: FERN_DETAILS });
  });

  it('should reject when the server answers with an error', async () => {
    // Given
    fakeApi({});

    // When / Then
    await expect(fetchPlant(2)).rejects.toThrow('404');
  });
});
