import { useMutation } from '@tanstack/react-query';
import { useRefreshModule } from '../plants/index.ts';
import { postponePlant, undoWatering, waterPlant } from './internal/wateringApi.ts';

// A refused change refreshes too: the board then shows what the other user did.
export const useWater = () => {
  const refreshModule = useRefreshModule();

  return useMutation({
    mutationFn: waterPlant,
    onSettled: refreshModule,
  });
};

export const useUndoWatering = () => {
  const refreshModule = useRefreshModule();

  return useMutation({
    mutationFn: undoWatering,
    onSettled: refreshModule,
  });
};

export const usePostpone = () => {
  const refreshModule = useRefreshModule();

  return useMutation({
    mutationFn: postponePlant,
    onSettled: refreshModule,
  });
};
