import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTiles, savePin } from './internal/tilesApi.ts';
import type { PinChange, Tile } from './types.ts';

const TILES_QUERY_KEY = ['tiles'] as const;
const PIN_MUTATION_KEY = ['tiles', 'pin'] as const;

const withPin = (tiles: Tile[] | undefined, { id, pinned }: PinChange): Tile[] | undefined =>
  tiles?.map((tile) => (tile.id === id ? { ...tile, pinned } : tile));

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
