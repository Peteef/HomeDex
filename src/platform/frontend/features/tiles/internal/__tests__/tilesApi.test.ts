import { describe, expect, it } from 'vitest';
import { fakeApi, ok, status } from '../../../../__tests__/helpers.tsx';
import { linkTile } from '../../../../__tests__/tiles.ts';
import type { TileDraft } from '../../types.ts';
import { createTile, deleteTile, fetchTiles, savePin, updateTile } from '../tilesApi.ts';

const FINANCES = linkTile({ en: { title: 'Finances', description: null } }, { id: 7 });

const DRAFT: TileDraft = {
  texts: { en: { title: 'Finances', description: null } },
  url: 'https://docs.example.com/budget',
  icon: 'wallet',
  scope: 'personal',
};

describe('tiles API', () => {
  describe('fetchTiles', () => {
    it('should read the tiles from GET /api/tiles', async () => {
      // Given
      fakeApi({ 'GET /api/tiles': ok({ tiles: [FINANCES] }) });

      // When
      const tiles = await fetchTiles();

      // Then
      expect(tiles).toEqual([FINANCES]);
    });
  });

  describe('createTile', () => {
    it('should post the draft and return the created tile', async () => {
      // Given
      const api = fakeApi({ 'POST /api/tiles': { status: 201, body: { tile: FINANCES } } });

      // When
      const tile = await createTile(DRAFT);

      // Then
      expect(tile).toEqual(FINANCES);
      expect(api.callsTo('POST /api/tiles')[0]?.body).toEqual(DRAFT);
    });

    it('should fail with the status when the API rejects the tile', async () => {
      // Given
      fakeApi({ 'POST /api/tiles': status(400) });

      // When
      const result = createTile(DRAFT);

      // Then
      await expect(result).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('updateTile', () => {
    it('should patch the tile with the draft and return the saved tile', async () => {
      // Given
      const api = fakeApi({ 'PATCH /api/tiles/7': ok({ tile: FINANCES }) });

      // When
      const tile = await updateTile({ id: 7, draft: DRAFT });

      // Then
      expect(tile).toEqual(FINANCES);
      expect(api.callsTo('PATCH /api/tiles/7')[0]?.body).toEqual(DRAFT);
    });
  });

  describe('deleteTile', () => {
    it('should delete the tile', async () => {
      // Given
      const api = fakeApi({ 'DELETE /api/tiles/7': { status: 204 } });

      // When
      await deleteTile(7);

      // Then
      expect(api.callsTo('DELETE /api/tiles/7')).toHaveLength(1);
    });
  });

  describe('savePin', () => {
    it('should pin with PUT', async () => {
      // Given
      const api = fakeApi({ 'PUT /api/tiles/7/pin': { status: 204 } });

      // When
      await savePin({ id: 7, pinned: true });

      // Then
      expect(api.callsTo('PUT /api/tiles/7/pin')).toHaveLength(1);
    });

    it('should unpin with DELETE', async () => {
      // Given
      const api = fakeApi({ 'DELETE /api/tiles/7/pin': { status: 204 } });

      // When
      await savePin({ id: 7, pinned: false });

      // Then
      expect(api.callsTo('DELETE /api/tiles/7/pin')).toHaveLength(1);
    });
  });
});
