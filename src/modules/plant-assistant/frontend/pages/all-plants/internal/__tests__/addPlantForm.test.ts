import { describe, expect, it } from 'vitest';
import type { AddPlantValues } from '../../types.ts';
import {
  lastWateredLimits,
  newPlantValues,
  toNewPlant,
  validateNewPlant,
} from '../addPlantForm.ts';

const TODAY = { today: '2026-11-20' };

const VALID: AddPlantValues = {
  name: "Bulbasaur's fern",
  description: '',
  tags: [],
  tagDraft: '',
  summerIntervalDays: '7',
  winterIntervalDays: '14',
  photo: { kind: 'keep' },
  lastWateredOn: '2026-11-20',
};

describe('addPlantForm', () => {
  describe('newPlantValues', () => {
    it('should start empty, last watered today', () => {
      // When / Then
      expect(newPlantValues('2026-11-20')).toEqual({
        name: '',
        description: '',
        tags: [],
        tagDraft: '',
        summerIntervalDays: '',
        winterIntervalDays: '',
        photo: { kind: 'keep' },
        lastWateredOn: '2026-11-20',
      });
    });
  });

  describe('validateNewPlant', () => {
    it('should find nothing wrong with valid values', () => {
      // When / Then
      expect(validateNewPlant(VALID, TODAY)).toEqual({});
    });

    it('should check the fields every plant has', () => {
      // When / Then
      expect(validateNewPlant({ ...VALID, name: '' }, TODAY)).toEqual({ name: 'nameRequired' });
    });

    it('should require the last watering', () => {
      // When / Then
      expect(validateNewPlant({ ...VALID, lastWateredOn: '' }, TODAY)).toEqual({
        lastWateredOn: 'dateRequired',
      });
    });

    it('should refuse a last watering in the future', () => {
      // When / Then
      expect(validateNewPlant({ ...VALID, lastWateredOn: '2026-11-21' }, TODAY)).toEqual({
        lastWateredOn: 'dateInFuture',
      });
    });

    it('should accept a last watering long ago', () => {
      // When / Then
      expect(validateNewPlant({ ...VALID, lastWateredOn: '2025-01-01' }, TODAY)).toEqual({});
    });
  });

  describe('lastWateredLimits', () => {
    it('should allow no last watering after today', () => {
      // When / Then
      expect(lastWateredLimits(TODAY)).toEqual({ max: '2026-11-20' });
    });
  });

  describe('toNewPlant', () => {
    it('should send the trimmed values with the last watering', () => {
      // When / Then
      expect(toNewPlant({ ...VALID, name: ' Oddish ', lastWateredOn: '2026-11-18' })).toEqual({
        name: 'Oddish',
        description: null,
        tags: [],
        summerIntervalDays: 7,
        winterIntervalDays: 14,
        lastWateredOn: '2026-11-18',
      });
    });

    it('should send a chosen photo, and nothing otherwise', () => {
      // When / Then
      expect(toNewPlant({ ...VALID, photo: { kind: 'replace', jpeg: '/9j/AAAA' } }).photo).toBe(
        '/9j/AAAA',
      );

      expect(toNewPlant(VALID)).not.toHaveProperty('photo');
      expect(toNewPlant({ ...VALID, photo: { kind: 'remove' } })).not.toHaveProperty('photo');
    });
  });
});
