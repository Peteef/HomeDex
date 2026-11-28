import { describe, expect, it } from 'vitest';
import type { PlantDetails } from '../../../../features/plants/index.ts';
import type { EditPlantValues } from '../../types.ts';
import {
  editPlantValues,
  nextWateringLimits,
  toPlantChanges,
  validatePlantEdit,
} from '../editPlantForm.ts';

const FERN: PlantDetails = {
  id: 1,
  name: "Bulbasaur's fern",
  description: 'Likes shade.',
  tags: ['Living room'],
  photoId: null,
  lastWateredOn: '2026-11-10',
  nextWateringOn: '2026-11-17',
  daysUntil: -3,
  urgency: 'overdue',
  summerIntervalDays: 7,
  winterIntervalDays: 14,
  currentSeason: 'winter',
};

const CONTEXT = { plant: FERN, today: '2026-11-20' };

const VALID: EditPlantValues = {
  name: "Bulbasaur's fern",
  description: '',
  tags: [],
  tagDraft: '',
  summerIntervalDays: '7',
  winterIntervalDays: '14',
  photo: { kind: 'keep' },
  nextWateringOn: '2026-11-17',
};

describe('editPlantForm', () => {
  describe('editPlantValues', () => {
    it('should start from the plant, with its next watering', () => {
      // When / Then
      expect(editPlantValues(FERN)).toEqual({
        name: "Bulbasaur's fern",
        description: 'Likes shade.',
        tags: ['Living room'],
        tagDraft: '',
        summerIntervalDays: '7',
        winterIntervalDays: '14',
        photo: { kind: 'keep' },
        nextWateringOn: '2026-11-17',
      });
    });
  });

  describe('validatePlantEdit', () => {
    it('should find nothing wrong with valid values', () => {
      // When / Then
      expect(validatePlantEdit(VALID, CONTEXT)).toEqual({});
    });

    it('should check the fields every plant has', () => {
      // When / Then
      expect(validatePlantEdit({ ...VALID, winterIntervalDays: '0' }, CONTEXT)).toEqual({
        winterIntervalDays: 'intervalInvalid',
      });
    });

    it('should require the next watering', () => {
      // When / Then
      expect(validatePlantEdit({ ...VALID, nextWateringOn: '' }, CONTEXT)).toEqual({
        nextWateringOn: 'dateRequired',
      });
    });

    it('should refuse a next watering changed to the past', () => {
      // When / Then
      expect(validatePlantEdit({ ...VALID, nextWateringOn: '2026-11-19' }, CONTEXT)).toEqual({
        nextWateringOn: 'dateInPast',
      });
    });

    it('should keep an unchanged next watering in the past', () => {
      // When / Then
      expect(validatePlantEdit({ ...VALID, nextWateringOn: '2026-11-17' }, CONTEXT)).toEqual({});
    });

    it('should accept a next watering changed to today', () => {
      // When / Then
      expect(validatePlantEdit({ ...VALID, nextWateringOn: '2026-11-20' }, CONTEXT)).toEqual({});
    });
  });

  describe('nextWateringLimits', () => {
    it('should allow no next watering before today once it is changed', () => {
      // When / Then
      expect(nextWateringLimits('2026-11-22', CONTEXT)).toEqual({ min: '2026-11-20' });
    });

    it('should set no limit while the next watering is unchanged', () => {
      // When / Then
      expect(nextWateringLimits('2026-11-17', CONTEXT)).toEqual({});
    });
  });

  describe('toPlantChanges', () => {
    it('should send the trimmed values with the next watering', () => {
      // When / Then
      expect(toPlantChanges({ ...VALID, name: ' Fern ', nextWateringOn: '2026-11-25' })).toEqual({
        name: 'Fern',
        description: null,
        tags: [],
        summerIntervalDays: 7,
        winterIntervalDays: 14,
        nextWateringOn: '2026-11-25',
      });
    });

    it('should send a chosen photo, null for a removed one, and nothing to keep it', () => {
      // When / Then
      expect(toPlantChanges({ ...VALID, photo: { kind: 'replace', jpeg: '/9j/AAAA' } }).photo).toBe(
        '/9j/AAAA',
      );

      expect(toPlantChanges({ ...VALID, photo: { kind: 'remove' } }).photo).toBeNull();
      expect(toPlantChanges(VALID)).not.toHaveProperty('photo');
    });
  });
});
