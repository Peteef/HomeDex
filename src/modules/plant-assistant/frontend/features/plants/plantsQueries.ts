import { skipToken } from '@tanstack/react-query';
import { fetchPlant, fetchPlants } from './internal/plantsApi.ts';
import { useLiveQuery } from './internal/useLiveQuery.ts';

const PLANTS_QUERY_KEY = ['plant-assistant', 'plants'] as const;

export const usePlants = () =>
  useLiveQuery({
    queryKey: PLANTS_QUERY_KEY,
    queryFn: fetchPlants,
  });

export const usePlant = (id: number | null) =>
  useLiveQuery({
    queryKey: [...PLANTS_QUERY_KEY, id],
    queryFn: id === null ? skipToken : () => fetchPlant(id),
  });
