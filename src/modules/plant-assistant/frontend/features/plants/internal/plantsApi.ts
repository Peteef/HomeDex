import { getJson } from '#platform/frontend';
import type { PlantList, PlantView } from '../types.ts';

const PLANTS_PATH = '/m/plant-assistant/plants';

export const fetchPlants = (): Promise<PlantList> => getJson<PlantList>(PLANTS_PATH);

export const fetchPlant = (id: number): Promise<PlantView> =>
  getJson<PlantView>(`${PLANTS_PATH}/${String(id)}`);
