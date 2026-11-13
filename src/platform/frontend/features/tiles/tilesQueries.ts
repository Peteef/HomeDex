import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTile, deleteTile, fetchTiles, savePin, updateTile } from './internal/tilesApi.ts';
import type { PinChange, Tile } from './types.ts';

const TILES_QUERY_KEY = ['tiles'] as const;
const PIN_MUTATION_KEY = ['tiles', 'pin'] as const;

const withPin = (tiles: Tile[] | undefined, { id, pinned }: PinChange): Tile[] | undefined =>
  tiles?.map((tile) => (tile.id === id ? { ...tile, pinned } : tile));

const withTile = (tiles: Tile[] | undefined, saved: Tile): Tile[] | undefined =>
  tiles?.some(({ id }) => id === saved.id)
    ? tiles.map((tile) => (tile.id === saved.id ? saved : tile))
    : tiles && [...tiles, saved];

const withoutTile = (tiles: Tile[] | undefined, id: number): Tile[] | undefined =>
  tiles?.filter((tile) => tile.id !== id);

const useTileCache = () => {
  const queryClient = useQueryClient();

  const store = (tile: Tile): void => {
    queryClient.setQueryData<Tile[]>(TILES_QUERY_KEY, (tiles) => withTile(tiles, tile));
  };

  const forget = (_result: unknown, id: number): void => {
    queryClient.setQueryData<Tile[]>(TILES_QUERY_KEY, (tiles) => withoutTile(tiles, id));
  };

  // Also after a failure: the tile may have been changed or removed by someone else. Not awaited,
  // so a save settles as soon as the server answers.
  const refresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: TILES_QUERY_KEY });
  };

  return {
    store,
    forget,
    refresh,
  };
};

export const useTiles = () =>
  useQuery({
    queryKey: TILES_QUERY_KEY,
    queryFn: fetchTiles,
  });

export const useTogglePin = () => {
  const queryClient = useQueryClient();

  const setPin = (change: PinChange): void => {
    queryClient.setQueryData<Tile[]>(TILES_QUERY_KEY, (tiles) => withPin(tiles, change));
  };

  const showAtOnce = async (change: PinChange): Promise<void> => {
    await queryClient.cancelQueries({ queryKey: TILES_QUERY_KEY });
    setPin(change);
  };

  // Undoes only this tile, so a failed pin never reverts another tile pinned in the meantime.
  const undo = (_error: unknown, { id, pinned }: PinChange): void => {
    setPin({ id, pinned: !pinned });
  };

  // Refetching while another pin is still on its way would briefly show the old state.
  const refreshWhenLast = async (): Promise<void> => {
    if (queryClient.isMutating({ mutationKey: PIN_MUTATION_KEY }) === 1) {
      await queryClient.invalidateQueries({ queryKey: TILES_QUERY_KEY });
    }
  };

  return useMutation({
    mutationKey: PIN_MUTATION_KEY,
    mutationFn: savePin,
    onMutate: showAtOnce,
    onError: undo,
    onSettled: refreshWhenLast,
  });
};

export const useCreateTile = () => {
  const { store, refresh } = useTileCache();

  return useMutation({
    mutationFn: createTile,
    onSuccess: store,
    onSettled: refresh,
  });
};

export const useUpdateTile = () => {
  const { store, refresh } = useTileCache();

  return useMutation({
    mutationFn: updateTile,
    onSuccess: store,
    onSettled: refresh,
  });
};

export const useDeleteTile = () => {
  const { forget, refresh } = useTileCache();

  return useMutation({
    mutationFn: deleteTile,
    onSuccess: forget,
    onSettled: refresh,
  });
};
