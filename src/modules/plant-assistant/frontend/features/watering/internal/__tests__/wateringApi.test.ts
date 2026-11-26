import { fakeApi } from '#platform/frontend/testing';
import { describe, expect, it } from 'vitest';
import { postponePlant, undoWatering, waterPlant } from '../wateringApi.ts';

const PREVIOUS = { lastWateredOn: '2026-11-10', nextWateringOn: '2026-11-17' };

describe('watering API', () => {
  it('should water a plant and answer the watering with the dates it replaced', async () => {
    // Given
    const api = fakeApi({
      'POST /api/m/plant-assistant/plants/1/waterings': {
        status: 201,
        body: { wateringId: 7, previous: PREVIOUS },
      },
    });

    // When
    const watering = await waterPlant(1);

    // Then
    expect(watering).toEqual({ wateringId: 7, previous: PREVIOUS });
    expect(api.callsTo('POST /api/m/plant-assistant/plants/1/waterings')).toHaveLength(1);
  });

  it('should undo a watering with the dates to put back', async () => {
    // Given
    const api = fakeApi({
      'POST /api/m/plant-assistant/plants/1/waterings/7/undo': { status: 204 },
    });

    // When
    await undoWatering({ plantId: 1, wateringId: 7, previous: PREVIOUS });

    // Then
    expect(api.callsTo('POST /api/m/plant-assistant/plants/1/waterings/7/undo')[0]?.body).toEqual({
      previous: PREVIOUS,
    });
  });

  it('should postpone a plant by the given days', async () => {
    // Given
    const api = fakeApi({ 'POST /api/m/plant-assistant/plants/1/postpone': { status: 204 } });

    // When
    await postponePlant({ plantId: 1, days: 2 });

    // Then
    expect(api.callsTo('POST /api/m/plant-assistant/plants/1/postpone')[0]?.body).toEqual({
      days: 2,
    });
  });
});
