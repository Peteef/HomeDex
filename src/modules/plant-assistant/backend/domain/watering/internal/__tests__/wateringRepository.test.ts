import path from 'node:path';
import { moduleTestStorage } from '#platform/backend/testing';
import { describe, expect, it } from 'vitest';
import { plantRepository } from '../../../plants/index.ts';
import { wateringRepository } from '../wateringRepository.ts';

const MODULE_DIR = path.resolve(import.meta.dirname, '../../../../..');

const FERN = {
  name: "Bulbasaur's fern",
  description: null,
  tags: [],
  summerIntervalDays: 7,
  winterIntervalDays: 14,
  lastWateredOn: '2026-06-01',
  nextWateringOn: '2026-06-08',
};

const newRepository = () => {
  const storage = moduleTestStorage(MODULE_DIR);
  const plants = plantRepository(storage);

  const wateringOf = (plantId: number, wateredOn = '2026-06-08') => ({
    plantId,
    wateredOn,
    accountId: 1,
    username: 'Misty',
  });

  return {
    storage,
    plants,
    waterings: wateringRepository(storage),
    wateringOf,
  };
};

describe('watering repository', () => {
  describe('insert and find', () => {
    it('should store a watering with the account that made it', () => {
      // Given
      const { plants, waterings, storage, wateringOf } = newRepository();
      const plantId = plants.insert(FERN);

      // When
      const id = waterings.insert(wateringOf(plantId));

      // Then
      expect(waterings.find(plantId, id)).toEqual({ id, plantId, wateredOn: '2026-06-08' });

      expect(
        storage
          .prepare('SELECT account_id, username FROM plant_assistant_waterings WHERE id = ?')
          .get(id),
      ).toEqual({ account_id: 1, username: 'Misty' });
    });

    it('should find nothing when the watering belongs to another plant', () => {
      // Given
      const { plants, waterings, wateringOf } = newRepository();
      const fern = plants.insert(FERN);
      const cactus = plants.insert({ ...FERN, name: "Cacnea's cactus" });
      const id = waterings.insert(wateringOf(fern));

      // When / Then
      expect(waterings.find(cactus, id)).toBeUndefined();
    });
  });

  describe('newestOf', () => {
    it('should find the newest watering of the plant', () => {
      // Given
      const { plants, waterings, wateringOf } = newRepository();
      const fern = plants.insert(FERN);
      const cactus = plants.insert({ ...FERN, name: "Cacnea's cactus" });
      waterings.insert(wateringOf(fern, '2026-06-08'));
      const newest = waterings.insert(wateringOf(fern, '2026-06-15'));
      waterings.insert(wateringOf(cactus, '2026-06-20'));

      // When / Then
      expect(waterings.newestOf(fern)).toEqual({
        id: newest,
        plantId: fern,
        wateredOn: '2026-06-15',
      });
    });

    it('should find nothing for a plant never watered', () => {
      // Given
      const { plants, waterings } = newRepository();

      // When / Then
      expect(waterings.newestOf(plants.insert(FERN))).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('should delete the watering', () => {
      // Given
      const { plants, waterings, wateringOf } = newRepository();
      const plantId = plants.insert(FERN);
      const id = waterings.insert(wateringOf(plantId));

      // When
      waterings.remove(id);

      // Then
      expect(waterings.find(plantId, id)).toBeUndefined();
    });
  });

  it('should delete the waterings with their plant', () => {
    // Given
    const { plants, waterings, storage, wateringOf } = newRepository();
    const plantId = plants.insert(FERN);
    waterings.insert(wateringOf(plantId));

    // When
    plants.remove(plantId);

    // Then
    expect(
      storage.prepare('SELECT COUNT(*) AS count FROM plant_assistant_waterings').get(),
    ).toEqual({ count: 0 });
  });
});
