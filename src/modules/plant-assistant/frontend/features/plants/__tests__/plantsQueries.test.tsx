import { fakeApi, ok, withProviders } from '#platform/frontend/testing';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import {
  useCreatePlant,
  useDeletePlant,
  useEditPlant,
  usePlant,
  usePlants,
  useTags,
} from '../index.ts';
import type { PlantDetails, PlantFields, PlantSummary } from '../index.ts';

const PLANTS = 'GET /api/m/plant-assistant/plants';
const FERN_PATH = 'GET /api/m/plant-assistant/plants/1';
const TAGS = 'GET /api/m/plant-assistant/tags';

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

const FERN_FIELDS: PlantFields = {
  name: "Bulbasaur's fern",
  description: null,
  tags: [],
  summerIntervalDays: 7,
  winterIntervalDays: 14,
};

const wrapper = ({ children }: { children: ReactNode }) => withProviders(children);

const renderWithPlant = async <Result,>(useMutationHook: () => Result) => {
  const hooks = renderHook(
    () => ({
      plants: usePlants(),
      plant: usePlant(1),
      tags: useTags(),
      mutation: useMutationHook(),
    }),
    { wrapper },
  );

  await waitFor(() => {
    expect(hooks.result.current.plant.data).toBeDefined();
  });

  await waitFor(() => {
    expect(hooks.result.current.tags.data).toBeDefined();
  });

  return hooks;
};

const loadedRoutes = {
  [PLANTS]: ok({ today: '2026-11-20', plants: [FERN] }),
  [FERN_PATH]: ok({ today: '2026-11-20', plant: FERN_DETAILS }),
  [TAGS]: ok({ tags: [] }),
};

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

  describe('useTags', () => {
    it('should load the tags in use', async () => {
      // Given
      fakeApi({ [TAGS]: ok({ tags: ['Living room', 'Shade'] }) });

      // When
      const { result } = renderHook(() => useTags(), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.data).toEqual({ tags: ['Living room', 'Shade'] });
      });
    });
  });

  describe('useCreatePlant', () => {
    it('should create the plant and then refresh the plants, the open plant and the tags', async () => {
      // Given
      const api = fakeApi({
        ...loadedRoutes,
        'POST /api/m/plant-assistant/plants': { status: 201, body: { plant: FERN_DETAILS } },
      });

      const { result } = await renderWithPlant(useCreatePlant);

      // When
      await act(() =>
        result.current.mutation.mutateAsync({ ...FERN_FIELDS, lastWateredOn: '2026-11-18' }),
      );

      // Then
      expect(api.callsTo('POST /api/m/plant-assistant/plants')).toHaveLength(1);
      expect(api.callsTo(PLANTS)).toHaveLength(2);
      expect(api.callsTo(FERN_PATH)).toHaveLength(2);
      expect(api.callsTo(TAGS)).toHaveLength(2);
    });
  });

  describe('useEditPlant', () => {
    it('should save the changes and then refresh the plants, the open plant and the tags', async () => {
      // Given
      const api = fakeApi({
        ...loadedRoutes,
        'PUT /api/m/plant-assistant/plants/1': { status: 204 },
      });

      const { result } = await renderWithPlant(useEditPlant);

      // When
      await act(() =>
        result.current.mutation.mutateAsync({
          id: 1,
          changes: { ...FERN_FIELDS, nextWateringOn: '2026-11-25' },
        }),
      );

      // Then
      expect(api.callsTo('PUT /api/m/plant-assistant/plants/1')).toHaveLength(1);
      expect(api.callsTo(PLANTS)).toHaveLength(2);
      expect(api.callsTo(FERN_PATH)).toHaveLength(2);
      expect(api.callsTo(TAGS)).toHaveLength(2);
    });
  });

  describe('useDeletePlant', () => {
    it('should delete the plant and then refresh everything but the deleted plant', async () => {
      // Given
      const api = fakeApi({
        ...loadedRoutes,
        'DELETE /api/m/plant-assistant/plants/1': { status: 204 },
      });

      const { result } = await renderWithPlant(useDeletePlant);

      // When
      await act(() => result.current.mutation.mutateAsync(1));

      // Then
      expect(api.callsTo('DELETE /api/m/plant-assistant/plants/1')).toHaveLength(1);
      expect(api.callsTo(PLANTS)).toHaveLength(2);
      expect(api.callsTo(TAGS)).toHaveLength(2);
      expect(api.callsTo(FERN_PATH)).toHaveLength(1);
    });
  });
});
