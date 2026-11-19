import path from 'node:path';
import { moduleTestStorage } from '#platform/backend/testing';
import { describe, expect, it } from 'vitest';
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
      expect(plants.find(id)).toEqual({ id, ...FERN });
    });

    it('should find nothing for an unknown id', () => {
      // When / Then
      expect(newRepository().plants.find(42)).toBeUndefined();
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
        { id: fern, ...FERN },
        { id: cactus, ...CACTUS },
      ]);
    });
  });

  describe('update', () => {
    it('should replace the fields and the tags', () => {
      // Given
      const { plants } = newRepository();
      const id = plants.insert(FERN);

      // When
      const updated = plants.update(id, { ...CACTUS, tags: ['Balcony'] });

      // Then
      expect(updated).toBe(true);
      expect(plants.find(id)).toEqual({ id, ...CACTUS, tags: ['Balcony'] });
    });

    it('should report an unknown plant', () => {
      // When / Then
      expect(newRepository().plants.update(42, FERN)).toBe(false);
    });
  });

  describe('remove', () => {
    it('should delete the plant and its tags', () => {
      // Given
      const { plants, storage } = newRepository();
      const id = plants.insert(FERN);

      // When
      const removed = plants.remove(id);

      // Then
      expect(removed).toBe(true);
      expect(plants.find(id)).toBeUndefined();

      expect(storage.prepare('SELECT COUNT(*) AS count FROM plant_assistant_tags').get()).toEqual({
        count: 0,
      });
    });

    it('should report an unknown plant', () => {
      // When / Then
      expect(newRepository().plants.remove(42)).toBe(false);
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
