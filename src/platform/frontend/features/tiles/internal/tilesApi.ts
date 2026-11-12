import { del, getJson, put } from '../../../lib/http/index.ts';
import type { PinChange, Tile } from '../types.ts';

interface TilesResponse {
  tiles: Tile[];
}

const TILES_PATH = '/tiles';

const pinPath = (id: number): string => `${TILES_PATH}/${String(id)}/pin`;

export const fetchTiles = async (): Promise<Tile[]> =>
  (await getJson<TilesResponse>(TILES_PATH)).tiles;

export const savePin = ({ id, pinned }: PinChange): Promise<void> =>
  pinned ? put(pinPath(id)) : del(pinPath(id));
