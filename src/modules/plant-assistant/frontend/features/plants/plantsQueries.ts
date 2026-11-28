import { hashKey, skipToken, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Query } from '@tanstack/react-query';
import {
  createPlant,
  deletePlant,
  editPlant,
  fetchPlant,
  fetchPlants,
  fetchTags,
} from './internal/plantsApi.ts';
import { useLiveQuery } from '#platform/frontend';

export const MODULE_QUERY_KEY = ['plant-assistant'] as const;
const PLANTS_QUERY_KEY = [...MODULE_QUERY_KEY, 'plants'] as const;
const TAGS_QUERY_KEY = [...MODULE_QUERY_KEY, 'tags'] as const;

const plantQueryKey = (id: number | null) => [...PLANTS_QUERY_KEY, id] as const;

export const usePlants = () =>
  useLiveQuery({
    queryKey: PLANTS_QUERY_KEY,
    queryFn: fetchPlants,
  });

export const usePlant = (id: number | null) =>
  useLiveQuery({
    queryKey: plantQueryKey(id),
    queryFn: id === null ? skipToken : () => fetchPlant(id),
  });

export const useTags = () =>
  useLiveQuery({
    queryKey: TAGS_QUERY_KEY,
    queryFn: fetchTags,
  });

export const useRefreshModule = () => {
  const queryClient = useQueryClient();
  return (): Promise<void> => queryClient.invalidateQueries({ queryKey: MODULE_QUERY_KEY });
};

export const useCreatePlant = () => {
  const refreshModule = useRefreshModule();

  return useMutation({
    mutationFn: createPlant,
    onSuccess: refreshModule,
  });
};

export const useEditPlant = () => {
  const refreshModule = useRefreshModule();

  return useMutation({
    mutationFn: editPlant,
    onSuccess: refreshModule,
  });
};

// The deleted plant's own query stays out of the refresh: it would only answer 404 while its
// dialog closes.
export const useDeletePlant = () => {
  const queryClient = useQueryClient();

  const refreshAllBut = (_result: unknown, id: number): Promise<void> => {
    const deletedKey = hashKey(plantQueryKey(id));

    return queryClient.invalidateQueries({
      queryKey: MODULE_QUERY_KEY,
      predicate: (query: Query) => query.queryHash !== deletedKey,
    });
  };

  return useMutation({
    mutationFn: deletePlant,
    onSuccess: refreshAllBut,
  });
};
