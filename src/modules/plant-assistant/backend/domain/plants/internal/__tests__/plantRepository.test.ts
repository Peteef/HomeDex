import path from 'node:path';
import { moduleTestStorage } from '#platform/backend/testing';
import { describe, expect, it } from 'vitest';
import { photoRepository } from '../photoRepository.ts';
import { plantRepository } from '../plantRepository.ts';

const MODULE_DIR = path.resolve(import.meta.dirname, '../../../../..');

const FERN = {
  name: "Bulbasaur's fern",
  description: 'Likes shade',
  tags: ['Salon', 'Shade'],
  summerIntervalDays: 7,
  winterIntervalDays: 14,
  lastWateredOn: '2026-06-01',
  nextWateringOn: '2026-06-08',
};

const CACTUS = {
  ...FERN,
  name: "Cacnea's cactus",
  description: null,
  tags: ['salon', 'Sun'],
};

const newRepository = () => {
  const storage = moduleTestStorage(MODULE_DIR);
  return {
    storage,
    plants: plantRepository(storage),
  };
};

describe('plant repository', () => {
  describe('insert and find', () => {
    it('should store a plant with its tags in the given order', () => {
      // Given
      const { plants } = newRepository();

      // When
      const id = plants.insert(FERN);

      // Then
      expect(plants.find(id)).toEqual({ id, photoId: null, ...FERN });
    });

    it('should store a plant without tags', () => {
      // Given
      const { plants } = newRepository();

      // When
      const id = plants.insert({ ...FERN, tags: [] });

      // Then
      expect(plants.find(id)?.tags).toEqual([]);
    });

    it('should find nothing for an unknown id', () => {
      // When / Then
      expect(newRepository().plants.find(42)).toBeUndefined();
    });
  });

  describe('photoId', () => {
    it('should give each plant the id of its photo', () => {
      // Given
      const { storage, plants } = newRepository();
      const fern = plants.insert(FERN);
      plants.insert(CACTUS);
      const photoId = photoRepository(storage).replace(fern, Buffer.from([0xff, 0xd8, 0xff]));

      // When / Then
      expect(plants.find(fern)?.photoId).toBe(photoId);
      expect(plants.list().map((plant) => plant.photoId)).toEqual([photoId, null]);
      expect(plants.find(fern)?.tags).toEqual(['Salon', 'Shade']);
    });
  });

  describe('list', () => {
    it('should list every plant with its own tags', () => {
      // Given
      const { plants } = newRepository();
      const fern = plants.insert(FERN);
      const cactus = plants.insert(CACTUS);

      // When / Then
      expect(plants.list()).toEqual([
        { id: fern, photoId: null, ...FERN },
        { id: cactus, photoId: null, ...CACTUS },
      ]);
    });
  });

  describe('update', () => {
    it('should replace the fields and the tags', () => {
      // Given
      const { plants } = newRepository();
      const id = plants.insert(FERN);

      // When
      plants.update(id, { ...CACTUS, tags: ['Balcony'] });

      // Then
      expect(plants.find(id)).toEqual({ id, photoId: null, ...CACTUS, tags: ['Balcony'] });
    });

    it('should change nothing for an unknown plant', () => {
      // Given
      const { plants } = newRepository();
      const id = plants.insert(FERN);

      // When
      plants.update(id + 1, CACTUS);

      // Then
      expect(plants.list()).toEqual([{ id, photoId: null, ...FERN }]);
    });
  });

  describe('setDates', () => {
    it('should change only the dates', () => {
      // Given
      const { plants } = newRepository();
      const id = plants.insert(FERN);

      // When
      plants.setDates(id, { lastWateredOn: '2026-06-09', nextWateringOn: '2026-06-16' });

      // Then
      expect(plants.find(id)).toEqual({
        id,
        photoId: null,
        ...FERN,
        lastWateredOn: '2026-06-09',
        nextWateringOn: '2026-06-16',
      });
    });

    it('should change nothing for an unknown plant', () => {
      // Given
      const { plants } = newRepository();
      const id = plants.insert(FERN);

      // When
      plants.setDates(id + 1, { lastWateredOn: '2026-06-09', nextWateringOn: '2026-06-16' });

      // Then
      expect(plants.list()).toEqual([{ id, photoId: null, ...FERN }]);
    });
  });

  describe('remove', () => {
    it('should delete the plant and its tags', () => {
      // Given
      const { plants, storage } = newRepository();
      const id = plants.insert(FERN);

      // When
      plants.remove(id);

      // Then
      expect(plants.find(id)).toBeUndefined();

      expect(storage.prepare('SELECT COUNT(*) AS count FROM plant_assistant_tags').get()).toEqual({
        count: 0,
      });
    });

    it('should change nothing for an unknown plant', () => {
      // Given
      const { plants } = newRepository();
      const id = plants.insert(FERN);

      // When
      plants.remove(id + 1);

      // Then
      expect(plants.list()).toEqual([{ id, photoId: null, ...FERN }]);
    });
  });

  describe('countDue', () => {
    it('should count nothing when no plant is due', () => {
      // Given
      const { plants } = newRepository();
      plants.insert({ ...FERN, nextWateringOn: '2026-06-09' });

      // When / Then
      expect(plants.countDue('2026-06-08')).toBe(0);
    });

    it('should count the plants due on the day or before it', () => {
      // Given
      const { plants } = newRepository();
      plants.insert({ ...FERN, nextWateringOn: '2026-06-01' });
      plants.insert({ ...FERN, nextWateringOn: '2026-06-08' });
      plants.insert({ ...CACTUS, nextWateringOn: '2026-06-09' });

      // When / Then
      expect(plants.countDue('2026-06-08')).toBe(2);
    });

    it('should count every plant when all are due', () => {
      // Given
      const { plants } = newRepository();
      plants.insert({ ...FERN, nextWateringOn: '2026-05-30' });
      plants.insert({ ...CACTUS, nextWateringOn: '2026-06-08' });

      // When / Then
      expect(plants.countDue('2026-06-08')).toBe(2);
    });

    it('should count nothing without plants', () => {
      // When / Then
      expect(newRepository().plants.countDue('2026-06-08')).toBe(0);
    });
  });

  describe('tags', () => {
    it('should list each tag once by its folded form, in its first spelling, sorted', () => {
      // Given
      const { plants } = newRepository();
      plants.insert({ ...FERN, tags: ['Żółw', 'Salon'] });
      plants.insert({ ...CACTUS, tags: ['salon', 'zolw', 'Balcony'] });

      // When / Then
      expect(plants.tags()).toEqual(['Balcony', 'Salon', 'Żółw']);
    });

    it('should list nothing without plants', () => {
      // When / Then
      expect(newRepository().plants.tags()).toEqual([]);
    });
  });
});
