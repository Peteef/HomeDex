import { fakeApi, ok, withProviders } from '#platform/frontend/testing';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { usePlant, usePlants } from '../index.ts';
import type { PlantDetails, PlantSummary } from '../index.ts';

const PLANTS = 'GET /api/m/plant-assistant/plants';

const FERN: PlantSummary = {
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

const FERN_DETAILS: PlantDetails = {
  ...FERN,
  summerIntervalDays: 7,
  winterIntervalDays: 14,
  currentSeason: 'winter',
};

const wrapper = ({ children }: { children: ReactNode }) => withProviders(children);

describe('plants queries', () => {
  describe('usePlants', () => {
    it('should load the plants with today', async () => {
      // Given
      fakeApi({ [PLANTS]: ok({ today: '2026-11-20', plants: [FERN] }) });

      // When
      const { result } = renderHook(() => usePlants(), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.data).toEqual({ today: '2026-11-20', plants: [FERN] });
      });
    });
  });

  describe('usePlant', () => {
    it('should load the plant with the given id', async () => {
      // Given
      fakeApi({
        'GET /api/m/plant-assistant/plants/1': ok({ today: '2026-11-20', plant: FERN_DETAILS }),
      });

      // When
      const { result } = renderHook(() => usePlant(1), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.data).toEqual({ today: '2026-11-20', plant: FERN_DETAILS });
      });
    });

    it('should load nothing when no plant is chosen', () => {
      // Given
      const api = fakeApi({});

      // When
      const { result } = renderHook(() => usePlant(null), { wrapper });

      // Then
      expect(result.current.data).toBeUndefined();
      expect(api.calls).toHaveLength(0);
    });
  });
});
