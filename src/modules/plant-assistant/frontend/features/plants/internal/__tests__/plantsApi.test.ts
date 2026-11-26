import { fakeApi, ok } from '#platform/frontend/testing';
import { describe, expect, it } from 'vitest';
import {
  createPlant,
  deletePlant,
  editPlant,
  fetchPlant,
  fetchPlants,
  fetchTags,
} from '../plantsApi.ts';

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

const FERN_FIELDS = {
  name: "Bulbasaur's fern",
  description: null,
  tags: ['Shade'],
  summerIntervalDays: 7,
  winterIntervalDays: 14,
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

  it('should create a plant and answer it', async () => {
    // Given
    const api = fakeApi({
      'POST /api/m/plant-assistant/plants': { status: 201, body: { plant: FERN_DETAILS } },
    });

    // When
    const created = await createPlant({ ...FERN_FIELDS, lastWateredOn: '2026-11-18' });

    // Then
    expect(created).toEqual({ plant: FERN_DETAILS });

    expect(api.callsTo('POST /api/m/plant-assistant/plants')[0]?.body).toEqual({
      name: "Bulbasaur's fern",
      description: null,
      tags: ['Shade'],
      summerIntervalDays: 7,
      winterIntervalDays: 14,
      lastWateredOn: '2026-11-18',
    });
  });

  it('should save the changes of a plant', async () => {
    // Given
    const api = fakeApi({ 'PUT /api/m/plant-assistant/plants/1': { status: 204 } });

    // When
    await editPlant({ id: 1, changes: { ...FERN_FIELDS, nextWateringOn: '2026-11-25' } });

    // Then
    expect(api.callsTo('PUT /api/m/plant-assistant/plants/1')[0]?.body).toEqual({
      name: "Bulbasaur's fern",
      description: null,
      tags: ['Shade'],
      summerIntervalDays: 7,
      winterIntervalDays: 14,
      nextWateringOn: '2026-11-25',
    });
  });

  it('should delete a plant', async () => {
    // Given
    const api = fakeApi({ 'DELETE /api/m/plant-assistant/plants/1': { status: 204 } });

    // When
    await deletePlant(1);

    // Then
    expect(api.callsTo('DELETE /api/m/plant-assistant/plants/1')).toHaveLength(1);
  });

  it('should fetch the tags in use', async () => {
    // Given
    fakeApi({ 'GET /api/m/plant-assistant/tags': ok({ tags: ['Living room', 'Shade'] }) });

    // When / Then
    expect(await fetchTags()).toEqual({ tags: ['Living room', 'Shade'] });
  });
});
