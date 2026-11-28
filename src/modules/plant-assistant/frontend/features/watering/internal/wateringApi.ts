import { post, postForJson } from '#platform/frontend';
import type { Postponement, Watering, WateringUndo } from '../types.ts';

const plantPath = (plantId: number): string => `/m/plant-assistant/plants/${String(plantId)}`;

export const waterPlant = (plantId: number): Promise<Watering> =>
  postForJson<Watering>(`${plantPath(plantId)}/waterings`);

export const undoWatering = ({ plantId, wateringId, previous }: WateringUndo): Promise<void> =>
  post(`${plantPath(plantId)}/waterings/${String(wateringId)}/undo`, { previous });

export const postponePlant = ({ plantId, days }: Postponement): Promise<void> =>
  post(`${plantPath(plantId)}/postpone`, { days });
