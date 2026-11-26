import { del, getJson, postForJson, put } from '#platform/frontend';
import type { CreatedPlant, NewPlant, PlantEdit, PlantList, PlantView, TagList } from '../types.ts';

const PLANTS_PATH = '/m/plant-assistant/plants';
const TAGS_PATH = '/m/plant-assistant/tags';

const plantPath = (id: number): string => `${PLANTS_PATH}/${String(id)}`;

export const fetchPlants = (): Promise<PlantList> => getJson<PlantList>(PLANTS_PATH);

export const fetchPlant = (id: number): Promise<PlantView> => getJson<PlantView>(plantPath(id));

export const createPlant = (plant: NewPlant): Promise<CreatedPlant> =>
  postForJson<CreatedPlant>(PLANTS_PATH, plant);

export const editPlant = ({ id, changes }: PlantEdit): Promise<void> => put(plantPath(id), changes);

export const deletePlant = (id: number): Promise<void> => del(plantPath(id));

export const fetchTags = (): Promise<TagList> => getJson<TagList>(TAGS_PATH);
