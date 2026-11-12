import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import {
  fakeApi,
  ok,
  status,
  testQueryClient,
  withProviders,
} from '../../../__tests__/helpers.tsx';
import type { FakeResponse } from '../../../__tests__/helpers.tsx';
import { useTiles, useTogglePin } from '../index.ts';
import { linkTile } from '../../../__tests__/tiles.ts';

const FINANCES = linkTile({ en: { title: 'Finances', description: null } }, { id: 1 });
const WEIGHT = linkTile({ en: { title: 'Weight log', description: null } }, { id: 2, dexNo: 2 });

const renderHooks = () => {
  const queryClient = testQueryClient();

  const wrapper = ({ children }: { children: ReactNode }) =>
    withProviders(children, { queryClient });

  return renderHook(
    () => ({
      tiles: useTiles(),
      togglePin: useTogglePin(),
    }),
    { wrapper },
  );
};

const pinnedOf = (tiles: { id: number; pinned: boolean }[] | undefined) =>
  tiles?.map(({ id, pinned }) => [id, pinned]);

const deferred = () => {
  let resolve: (response: FakeResponse) => void = () => undefined;

  const promise = new Promise<FakeResponse>((done) => {
    resolve = done;
  });

  return {
    promise,
    resolve,
  };
};

describe('tiles queries', () => {
  describe('useTiles', () => {
    it('should load the tiles from the API', async () => {
      // Given
      fakeApi({ 'GET /api/tiles': ok({ tiles: [FINANCES, WEIGHT] }) });

      // When
      const { result } = renderHooks();

      // Then
      await waitFor(() => {
        expect(result.current.tiles.data).toEqual([FINANCES, WEIGHT]);
      });
    });
  });

  describe('useTogglePin', () => {
    it('should show the pin at once and save it with PUT', async () => {
      // Given
      const saved = deferred();

      const api = fakeApi({
        'GET /api/tiles': ok({ tiles: [FINANCES, WEIGHT] }),
        'PUT /api/tiles/2/pin': () => saved.promise,
      });

      const { result } = renderHooks();

      await waitFor(() => {
        expect(result.current.tiles.data).toBeDefined();
      });

      // When
      act(() => {
        result.current.togglePin.mutate({ id: 2, pinned: true });
      });

      // Then
      await waitFor(() => {
        expect(pinnedOf(result.current.tiles.data)).toEqual([
          [1, false],
          [2, true],
        ]);
      });

      expect(api.callsTo('PUT /api/tiles/2/pin')).toHaveLength(1);
      saved.resolve({ status: 204 });
    });

    it('should save an unpin with DELETE and reload the tiles afterwards', async () => {
      // Given
      const api = fakeApi({
        'GET /api/tiles': ok({ tiles: [{ ...FINANCES, pinned: true }] }),
        'DELETE /api/tiles/1/pin': { status: 204 },
      });

      const { result } = renderHooks();

      await waitFor(() => {
        expect(result.current.tiles.data).toBeDefined();
      });

      // When
      act(() => {
        result.current.togglePin.mutate({ id: 1, pinned: false });
      });

      // Then
      await waitFor(() => {
        expect(api.callsTo('GET /api/tiles')).toHaveLength(2);
      });

      expect(api.callsTo('DELETE /api/tiles/1/pin')).toHaveLength(1);
    });

    it('should undo the pin when saving it fails', async () => {
      // Given
      const failed = deferred();

      fakeApi({
        'GET /api/tiles': ok({ tiles: [FINANCES, WEIGHT] }),
        'PUT /api/tiles/2/pin': () => failed.promise,
      });

      const { result } = renderHooks();

      await waitFor(() => {
        expect(result.current.tiles.data).toBeDefined();
      });

      act(() => {
        result.current.togglePin.mutate({ id: 2, pinned: true });
      });

      await waitFor(() => {
        expect(pinnedOf(result.current.tiles.data)).toContainEqual([2, true]);
      });

      // When
      failed.resolve(status(404));

      // Then
      await waitFor(() => {
        expect(pinnedOf(result.current.tiles.data)).toEqual([
          [1, false],
          [2, false],
        ]);
      });
    });

    it('should keep another tile pinned in the meantime when one pin fails', async () => {
      // Given
      const failed = deferred();
      const saved = deferred();

      fakeApi({
        'GET /api/tiles': ok({ tiles: [FINANCES, WEIGHT] }),
        'PUT /api/tiles/1/pin': () => failed.promise,
        'PUT /api/tiles/2/pin': () => saved.promise,
      });

      const { result } = renderHooks();

      await waitFor(() => {
        expect(result.current.tiles.data).toBeDefined();
      });

      act(() => {
        result.current.togglePin.mutate({ id: 1, pinned: true });
      });

      act(() => {
        result.current.togglePin.mutate({ id: 2, pinned: true });
      });

      await waitFor(() => {
        expect(pinnedOf(result.current.tiles.data)).toContainEqual([2, true]);
      });

      // When
      failed.resolve(status(500));

      // Then
      await waitFor(() => {
        expect(pinnedOf(result.current.tiles.data)).toEqual([
          [1, false],
          [2, true],
        ]);
      });

      saved.resolve({ status: 204 });
    });
  });
});
