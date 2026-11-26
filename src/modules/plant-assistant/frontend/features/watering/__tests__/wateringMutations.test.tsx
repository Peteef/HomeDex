import { fakeApi, ok, status, withProviders } from '#platform/frontend/testing';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { usePlants } from '../../plants/index.ts';
import { isConflict, usePostpone, useUndoWatering, useWater } from '../index.ts';

const PLANTS = 'GET /api/m/plant-assistant/plants';
const WATER = 'POST /api/m/plant-assistant/plants/1/waterings';
const PREVIOUS = { lastWateredOn: '2026-11-10', nextWateringOn: '2026-11-17' };

const wrapper = ({ children }: { children: ReactNode }) => withProviders(children);

const renderWith = async <Result,>(useMutationHook: () => Result) => {
  const hooks = renderHook(
    () => ({
      plants: usePlants(),
      mutation: useMutationHook(),
    }),
    { wrapper },
  );

  await waitFor(() => {
    expect(hooks.result.current.plants.data).toBeDefined();
  });

  return hooks;
};

const listed = ok({ today: '2026-11-20', plants: [] });

describe('watering mutations', () => {
  describe('useWater', () => {
    it('should water the plant and then refresh the plants', async () => {
      // Given
      const api = fakeApi({
        [PLANTS]: listed,
        [WATER]: { status: 201, body: { wateringId: 7, previous: PREVIOUS } },
      });

      const { result } = await renderWith(useWater);

      // When
      const watering = await act(() => result.current.mutation.mutateAsync(1));

      // Then
      expect(watering).toEqual({ wateringId: 7, previous: PREVIOUS });
      expect(api.callsTo(PLANTS)).toHaveLength(2);
    });

    it('should refresh the plants and report a conflict when someone else was faster', async () => {
      // Given
      const api = fakeApi({ [PLANTS]: listed, [WATER]: status(409) });
      const { result } = await renderWith(useWater);

      // When
      const error = await act(() =>
        result.current.mutation.mutateAsync(1).catch((refused: unknown) => refused),
      );

      // Then
      expect(isConflict(error)).toBe(true);
      expect(api.callsTo(PLANTS)).toHaveLength(2);
    });
  });

  describe('useUndoWatering', () => {
    it('should undo the watering and then refresh the plants', async () => {
      // Given
      const api = fakeApi({
        [PLANTS]: listed,
        'POST /api/m/plant-assistant/plants/1/waterings/7/undo': { status: 204 },
      });

      const { result } = await renderWith(useUndoWatering);

      // When
      await act(() =>
        result.current.mutation.mutateAsync({ plantId: 1, wateringId: 7, previous: PREVIOUS }),
      );

      // Then
      expect(api.callsTo('POST /api/m/plant-assistant/plants/1/waterings/7/undo')[0]?.body).toEqual(
        { previous: PREVIOUS },
      );

      expect(api.callsTo(PLANTS)).toHaveLength(2);
    });
  });

  describe('usePostpone', () => {
    it('should postpone the plant and then refresh the plants', async () => {
      // Given
      const api = fakeApi({
        [PLANTS]: listed,
        'POST /api/m/plant-assistant/plants/1/postpone': { status: 204 },
      });

      const { result } = await renderWith(usePostpone);

      // When
      await act(() => result.current.mutation.mutateAsync({ plantId: 1, days: 2 }));

      // Then
      expect(api.callsTo('POST /api/m/plant-assistant/plants/1/postpone')[0]?.body).toEqual({
        days: 2,
      });

      expect(api.callsTo(PLANTS)).toHaveLength(2);
    });
  });
});
