import path from 'node:path';
import { moduleTestStorage } from '#platform/backend/testing';
import { describe, expect, it } from 'vitest';
import { plantRepository } from '../../../plants/index.ts';
import { wateringEventRepository } from '../wateringEventRepository.ts';

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

  const eventOf = (plantId: number, wateredOn = '2026-06-08') => ({
    plantId,
    wateredOn,
    accountId: 1,
    username: 'Misty',
  });

  return {
    storage,
    plants,
    events: wateringEventRepository(storage),
    eventOf,
  };
};

describe('watering event repository', () => {
  describe('insert and find', () => {
    it('should store a watering with the account that made it', () => {
      // Given
      const { plants, events, storage, eventOf } = newRepository();
      const plantId = plants.insert(FERN);

      // When
      const id = events.insert(eventOf(plantId));

      // Then
      expect(events.find(plantId, id)).toEqual({ id, plantId, wateredOn: '2026-06-08' });

      expect(
        storage
          .prepare('SELECT account_id, username FROM plant_assistant_watering_events WHERE id = ?')
          .get(id),
      ).toEqual({ account_id: 1, username: 'Misty' });
    });

    it('should find nothing when the watering belongs to another plant', () => {
      // Given
      const { plants, events, eventOf } = newRepository();
      const fern = plants.insert(FERN);
      const cactus = plants.insert({ ...FERN, name: "Cacnea's cactus" });
      const id = events.insert(eventOf(fern));

      // When / Then
      expect(events.find(cactus, id)).toBeUndefined();
    });
  });

  describe('newestOf', () => {
    it('should find the newest watering of the plant', () => {
      // Given
      const { plants, events, eventOf } = newRepository();
      const fern = plants.insert(FERN);
      const cactus = plants.insert({ ...FERN, name: "Cacnea's cactus" });
      events.insert(eventOf(fern, '2026-06-08'));
      const newest = events.insert(eventOf(fern, '2026-06-15'));
      events.insert(eventOf(cactus, '2026-06-20'));

      // When / Then
      expect(events.newestOf(fern)).toEqual({
        id: newest,
        plantId: fern,
        wateredOn: '2026-06-15',
      });
    });

    it('should find nothing for a plant never watered', () => {
      // Given
      const { plants, events } = newRepository();

      // When / Then
      expect(events.newestOf(plants.insert(FERN))).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('should delete the watering', () => {
      // Given
      const { plants, events, eventOf } = newRepository();
      const plantId = plants.insert(FERN);
      const id = events.insert(eventOf(plantId));

      // When
      events.remove(id);

      // Then
      expect(events.find(plantId, id)).toBeUndefined();
    });
  });

  it('should delete the events with their plant', () => {
    // Given
    const { plants, events, storage, eventOf } = newRepository();
    const plantId = plants.insert(FERN);
    events.insert(eventOf(plantId));

    // When
    plants.remove(plantId);

    // Then
    expect(
      storage.prepare('SELECT COUNT(*) AS count FROM plant_assistant_watering_events').get(),
    ).toEqual({ count: 0 });
  });
});
