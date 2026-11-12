import { del, getJson, patchForJson, postForJson, put } from '../../../lib/http/index.ts';
import type { PinChange, Tile, TileDraft, TileUpdate } from '../types.ts';

interface TilesResponse {
  tiles: Tile[];
}

interface TileResponse {
  tile: Tile;
}

const TILES_PATH = '/tiles';

const tilePath = (id: number): string => `${TILES_PATH}/${String(id)}`;

const pinPath = (id: number): string => `${tilePath(id)}/pin`;

export const fetchTiles = async (): Promise<Tile[]> =>
  (await getJson<TilesResponse>(TILES_PATH)).tiles;

export const createTile = async (draft: TileDraft): Promise<Tile> =>
  (await postForJson<TileResponse>(TILES_PATH, draft)).tile;

export const updateTile = async ({ id, draft }: TileUpdate): Promise<Tile> =>
  (await patchForJson<TileResponse>(tilePath(id), draft)).tile;

export const deleteTile = (id: number): Promise<void> => del(tilePath(id));

export const savePin = ({ id, pinned }: PinChange): Promise<void> =>
  pinned ? put(pinPath(id)) : del(pinPath(id));
