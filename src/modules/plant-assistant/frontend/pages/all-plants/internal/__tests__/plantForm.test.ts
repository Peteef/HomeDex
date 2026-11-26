import { describe, expect, it } from 'vitest';
import type { PlantDetails } from '../../../../features/plants/index.ts';
import type { PlantFormValues } from '../../types.ts';
import {
  addTag,
  dateLimitsOf,
  hasErrors,
  newPlantValues,
  plantValues,
  removeTag,
  toNewPlant,
  toPlantChanges,
  validatePlant,
} from '../plantForm.ts';

const TODAY = '2026-11-20';

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

const VALID: PlantFormValues = {
  name: "Bulbasaur's fern",
  description: '',
  tags: [],
  tagDraft: '',
  summerIntervalDays: '7',
  winterIntervalDays: '14',
  date: TODAY,
};

const ADD = { mode: 'add' } as const;
const EDIT = { mode: 'edit', plant: FERN } as const;

const tenTags = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

describe('plantForm', () => {
  describe('newPlantValues', () => {
    it('should start empty, last watered today', () => {
      // When / Then
      expect(newPlantValues(TODAY)).toEqual({
        name: '',
        description: '',
        tags: [],
        tagDraft: '',
        summerIntervalDays: '',
        winterIntervalDays: '',
        date: '2026-11-20',
      });
    });
  });

  describe('plantValues', () => {
    it('should start from the plant, with its next watering', () => {
      // When / Then
      expect(plantValues(FERN)).toEqual({
        name: "Bulbasaur's fern",
        description: 'Likes shade.',
        tags: ['Living room'],
        tagDraft: '',
        summerIntervalDays: '7',
        winterIntervalDays: '14',
        date: '2026-11-17',
      });
    });

    it('should leave the description empty when the plant has none', () => {
      // When / Then
      expect(plantValues({ ...FERN, description: null }).description).toBe('');
    });
  });

  describe('validatePlant', () => {
    it('should find nothing wrong with valid values', () => {
      // When
      const errors = validatePlant(VALID, ADD, TODAY);

      // Then
      expect(errors).toEqual({});
      expect(hasErrors(errors)).toBe(false);
    });

    it('should require a name that is not blank', () => {
      // When / Then
      expect(validatePlant({ ...VALID, name: '   ' }, ADD, TODAY)).toEqual({
        name: 'nameRequired',
      });
    });

    it('should refuse a name longer than 60 characters', () => {
      // When / Then
      expect(validatePlant({ ...VALID, name: 'a'.repeat(61) }, ADD, TODAY)).toEqual({
        name: 'nameTooLong',
      });
    });

    it('should accept a 60-character name with spaces around it', () => {
      // When / Then
      expect(validatePlant({ ...VALID, name: ` ${'a'.repeat(60)} ` }, ADD, TODAY)).toEqual({});
    });

    it('should refuse a description longer than 1000 characters', () => {
      // When / Then
      expect(validatePlant({ ...VALID, description: 'a'.repeat(1001) }, ADD, TODAY)).toEqual({
        description: 'descriptionTooLong',
      });
    });

    it.each(['0', '366', '1.5', '', '-1', '1e2'])('should refuse an interval of "%s"', (days) => {
      // When / Then
      expect(
        validatePlant({ ...VALID, summerIntervalDays: days, winterIntervalDays: days }, ADD, TODAY),
      ).toEqual({ summerIntervalDays: 'intervalInvalid', winterIntervalDays: 'intervalInvalid' });
    });

    it.each(['1', '365'])('should accept an interval of %s days', (days) => {
      // When / Then
      expect(validatePlant({ ...VALID, summerIntervalDays: days }, ADD, TODAY)).toEqual({});
    });

    it('should require a date', () => {
      // When / Then
      expect(validatePlant({ ...VALID, date: '' }, ADD, TODAY)).toEqual({ date: 'dateRequired' });
    });

    it('should refuse a last watering in the future', () => {
      // When / Then
      expect(validatePlant({ ...VALID, date: '2026-11-21' }, ADD, TODAY)).toEqual({
        date: 'dateInFuture',
      });
    });

    it('should accept a last watering long ago', () => {
      // When / Then
      expect(validatePlant({ ...VALID, date: '2025-01-01' }, ADD, TODAY)).toEqual({});
    });

    it('should refuse a next watering changed to the past', () => {
      // When / Then
      expect(validatePlant({ ...VALID, date: '2026-11-19' }, EDIT, TODAY)).toEqual({
        date: 'dateInPast',
      });
    });

    it('should keep an unchanged next watering in the past', () => {
      // When / Then
      expect(validatePlant({ ...VALID, date: '2026-11-17' }, EDIT, TODAY)).toEqual({});
    });

    it('should accept a next watering changed to today', () => {
      // When / Then
      expect(validatePlant({ ...VALID, date: TODAY }, EDIT, TODAY)).toEqual({});
    });
  });

  describe('dateLimitsOf', () => {
    it('should allow no last watering after today', () => {
      // When / Then
      expect(dateLimitsOf(ADD, TODAY, TODAY)).toEqual({ max: '2026-11-20' });
    });

    it('should allow no next watering before today once it is changed', () => {
      // When / Then
      expect(dateLimitsOf(EDIT, TODAY, '2026-11-22')).toEqual({ min: '2026-11-20' });
    });

    it('should set no limit while the next watering is unchanged', () => {
      // When / Then
      expect(dateLimitsOf(EDIT, TODAY, '2026-11-17')).toEqual({});
    });
  });

  describe('addTag', () => {
    it('should add the trimmed tag and clear the field', () => {
      // When
      const added = addTag({ ...VALID, tags: ['Shade'], tagDraft: '  Living room ' });

      // Then
      expect(added.values.tags).toEqual(['Shade', 'Living room']);
      expect(added.values.tagDraft).toBe('');
      expect(added.tagNote).toBeNull();
    });

    it('should do nothing when the field is blank', () => {
      // When
      const added = addTag({ ...VALID, tagDraft: '  ' });

      // Then
      expect(added.values.tags).toEqual([]);
      expect(added.values.tagDraft).toBe('  ');
      expect(added.tagNote).toBeNull();
    });

    it('should ignore a tag already there, whatever its case and diacritics, and clear the field', () => {
      // When
      const added = addTag({ ...VALID, tags: ['Żółw'], tagDraft: 'zolw' });

      // Then
      expect(added.values.tags).toEqual(['Żółw']);
      expect(added.values.tagDraft).toBe('');
      expect(added.tagNote).toBe('tagDuplicate');
    });

    it('should keep a tag longer than 30 characters in the field', () => {
      // When
      const added = addTag({ ...VALID, tagDraft: 'a'.repeat(31) });

      // Then
      expect(added.values.tags).toEqual([]);
      expect(added.values.tagDraft).toBe('a'.repeat(31));
      expect(added.tagNote).toBe('tagTooLong');
    });

    it('should keep an eleventh tag in the field', () => {
      // When
      const added = addTag({ ...VALID, tags: tenTags, tagDraft: 'K' });

      // Then
      expect(added.values.tags).toEqual(tenTags);
      expect(added.values.tagDraft).toBe('K');
      expect(added.tagNote).toBe('tooManyTags');
    });
  });

  describe('removeTag', () => {
    it('should remove the tag', () => {
      // When / Then
      expect(removeTag({ ...VALID, tags: ['Shade', 'Living room'] }, 'Shade').tags).toEqual([
        'Living room',
      ]);
    });
  });

  describe('toNewPlant', () => {
    it('should send the trimmed values with the last watering', () => {
      // When / Then
      expect(
        toNewPlant({
          ...VALID,
          name: "  Bulbasaur's fern ",
          description: ' Likes shade.\nMist it. ',
          tags: ['Shade'],
          tagDraft: 'Not added',
          date: '2026-11-18',
        }),
      ).toEqual({
        name: "Bulbasaur's fern",
        description: 'Likes shade.\nMist it.',
        tags: ['Shade'],
        summerIntervalDays: 7,
        winterIntervalDays: 14,
        lastWateredOn: '2026-11-18',
      });
    });

    it('should send no description when it is blank', () => {
      // When / Then
      expect(toNewPlant({ ...VALID, description: '  ' }).description).toBeNull();
    });
  });

  describe('toPlantChanges', () => {
    it('should send the trimmed values with the next watering', () => {
      // When / Then
      expect(toPlantChanges({ ...VALID, name: ' Fern ', date: '2026-11-25' })).toEqual({
        name: 'Fern',
        description: null,
        tags: [],
        summerIntervalDays: 7,
        winterIntervalDays: 14,
        nextWateringOn: '2026-11-25',
      });
    });
  });
});
