import path from 'node:path';
import { moduleTestStorage } from '#platform/backend/testing';
import { describe, expect, it } from 'vitest';
import { photoRepository } from '../photoRepository.ts';
import { plantRepository } from '../plantRepository.ts';

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

const FIRST_JPEG = Buffer.from([0xff, 0xd8, 0xff, 0x01]);
const SECOND_JPEG = Buffer.from([0xff, 0xd8, 0xff, 0x02]);

const newRepositories = () => {
  const storage = moduleTestStorage(MODULE_DIR);
  const plants = plantRepository(storage);

  return {
    storage,
    plants,
    photos: photoRepository(storage),
    fern: plants.insert(FERN),
  };
};

const photoCount = (storage: ReturnType<typeof moduleTestStorage>) =>
  storage.prepare('SELECT COUNT(*) AS count FROM plant_assistant_photos').get();

describe('photo repository', () => {
  it('should store a photo and find it by its plant', () => {
    // Given
    const { photos, fern } = newRepositories();

    // When
    const id = photos.replace(fern, FIRST_JPEG);

    // Then
    expect(photos.find(fern)).toEqual({ id, jpeg: FIRST_JPEG });
  });

  it('should find nothing for a plant without a photo', () => {
    // Given
    const { photos, fern } = newRepositories();

    // When / Then
    expect(photos.find(fern)).toBeUndefined();
  });

  it('should replace a photo with a new row and a new id', () => {
    // Given
    const { storage, photos, fern } = newRepositories();
    const firstId = photos.replace(fern, FIRST_JPEG);

    // When
    const secondId = photos.replace(fern, SECOND_JPEG);

    // Then
    expect(secondId).not.toBe(firstId);
    expect(photos.find(fern)).toEqual({ id: secondId, jpeg: SECOND_JPEG });
    expect(photoCount(storage)).toEqual({ count: 1 });
  });

  it('should remove the photo', () => {
    // Given
    const { photos, fern } = newRepositories();
    photos.replace(fern, FIRST_JPEG);

    // When
    photos.remove(fern);

    // Then
    expect(photos.find(fern)).toBeUndefined();
  });

  it('should delete the photo with its plant', () => {
    // Given
    const { storage, plants, photos, fern } = newRepositories();
    photos.replace(fern, FIRST_JPEG);

    // When
    plants.remove(fern);

    // Then
    expect(photoCount(storage)).toEqual({ count: 0 });
  });
});
