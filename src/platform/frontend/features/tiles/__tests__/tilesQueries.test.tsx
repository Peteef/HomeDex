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
import { useCreateTile, useDeleteTile, useTiles, useTogglePin, useUpdateTile } from '../index.ts';
import type { Tile, TileDraft } from '../index.ts';
import { linkTile } from '../../../__tests__/tiles.ts';

const FINANCES = linkTile({ en: { title: 'Finances', description: null } }, { id: 1 });
const WEIGHT = linkTile({ en: { title: 'Weight log', description: null } }, { id: 2, dexNo: 2 });

const useHooks = () => ({
  tiles: useTiles(),
  togglePin: useTogglePin(),
  create: useCreateTile(),
  update: useUpdateTile(),
  remove: useDeleteTile(),
});

const renderHooks = () => {
  const queryClient = testQueryClient();

  const wrapper = ({ children }: { children: ReactNode }) =>
    withProviders(children, { queryClient });

  return renderHook(useHooks, { wrapper });
};

const DRAFT: TileDraft = {
  texts: { en: { title: 'Recipes', description: null } },
  url: 'https://docs.example.com/recipes',
  icon: 'food',
  scope: 'personal',
};

const RECIPES = linkTile(DRAFT.texts, { id: 3, dexNo: 3, icon: 'food', scope: 'personal' });

const titlesOf = (tiles: { texts: { en?: { title: string } } }[] | undefined) =>
  tiles?.map(({ texts }) => texts.en?.title);

const loaded = async (result: { current: ReturnType<typeof useHooks> }) => {
  await waitFor(() => {
    expect(result.current.tiles.data).toBeDefined();
  });
};

// The first load answers; the reload after a save stays pending, so the test sees the cache update.
const loadOnce = (tiles: Tile[]) => {
  let loads = 0;

  return () => {
    loads += 1;
    return loads === 1 ? ok({ tiles }) : new Promise<FakeResponse>(() => undefined);
  };
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

  describe('useCreateTile', () => {
    it('should add the created tile to the list and reload it', async () => {
      // Given
      const api = fakeApi({
        'GET /api/tiles': loadOnce([FINANCES]),
        'POST /api/tiles': { status: 201, body: { tile: RECIPES } },
      });

      const { result } = renderHooks();
      await loaded(result);

      // When
      await act(() => result.current.create.mutateAsync(DRAFT));

      // Then
      await waitFor(() => {
        expect(titlesOf(result.current.tiles.data)).toEqual(['Finances', 'Recipes']);
      });

      expect(api.callsTo('POST /api/tiles')[0]?.body).toEqual(DRAFT);

      await waitFor(() => {
        expect(api.callsTo('GET /api/tiles')).toHaveLength(2);
      });
    });

    it('should leave the list as it is when the API rejects the tile', async () => {
      // Given
      fakeApi({
        'GET /api/tiles': ok({ tiles: [FINANCES] }),
        'POST /api/tiles': status(400),
      });

      const { result } = renderHooks();
      await loaded(result);

      // When
      await act(() => result.current.create.mutateAsync(DRAFT).catch(() => undefined));

      // Then
      await waitFor(() => {
        expect(result.current.create.isError).toBe(true);
      });

      expect(titlesOf(result.current.tiles.data)).toEqual(['Finances']);
    });
  });

  describe('useUpdateTile', () => {
    it('should replace the tile with the saved one', async () => {
      // Given
      const renamed = linkTile({ en: { title: 'Budget', description: null } }, { id: 1 });

      const api = fakeApi({
        'GET /api/tiles': loadOnce([FINANCES, WEIGHT]),
        'PATCH /api/tiles/1': ok({ tile: renamed }),
      });

      const { result } = renderHooks();
      await loaded(result);

      // When
      await act(() => result.current.update.mutateAsync({ id: 1, draft: DRAFT }));

      // Then
      await waitFor(() => {
        expect(titlesOf(result.current.tiles.data)).toEqual(['Budget', 'Weight log']);
      });

      expect(api.callsTo('PATCH /api/tiles/1')[0]?.body).toEqual(DRAFT);
    });

    it('should reload the tiles when the tile is gone', async () => {
      // Given
      const api = fakeApi({
        'GET /api/tiles': ok({ tiles: [FINANCES] }),
        'PATCH /api/tiles/1': status(404),
      });

      const { result } = renderHooks();
      await loaded(result);

      // When
      await act(() =>
        result.current.update.mutateAsync({ id: 1, draft: DRAFT }).catch(() => undefined),
      );

      // Then
      await waitFor(() => {
        expect(api.callsTo('GET /api/tiles')).toHaveLength(2);
      });
    });
  });

  describe('useDeleteTile', () => {
    it('should remove the tile from the list', async () => {
      // Given
      const api = fakeApi({
        'GET /api/tiles': loadOnce([FINANCES, WEIGHT]),
        'DELETE /api/tiles/1': { status: 204 },
      });

      const { result } = renderHooks();
      await loaded(result);

      // When
      await act(() => result.current.remove.mutateAsync(1));

      // Then
      await waitFor(() => {
        expect(titlesOf(result.current.tiles.data)).toEqual(['Weight log']);
      });

      expect(api.callsTo('DELETE /api/tiles/1')).toHaveLength(1);
    });
  });
});
