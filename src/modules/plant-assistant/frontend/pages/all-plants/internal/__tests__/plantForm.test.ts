import { describe, expect, it } from 'vitest';
import type { PlantDetails } from '../../../../features/plants/index.ts';
import type { PlantFormValues } from '../../types.ts';
import {
  addTag,
  emptyFormValues,
  errorsOf,
  formValuesOf,
  hasErrors,
  removeTag,
  shownPhoto,
  toFields,
  validateFormFields,
} from '../plantForm.ts';

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
  photo: { kind: 'keep' },
};

const errorsIn = (values: PlantFormValues) => errorsOf(validateFormFields(values));

const tenTags = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

describe('plantForm', () => {
  describe('emptyFormValues', () => {
    it('should start empty', () => {
      // When / Then
      expect(emptyFormValues()).toEqual({
        name: '',
        description: '',
        tags: [],
        tagDraft: '',
        summerIntervalDays: '',
        winterIntervalDays: '',
        photo: { kind: 'keep' },
      });
    });
  });

  describe('formValuesOf', () => {
    it('should start from the plant', () => {
      // When / Then
      expect(formValuesOf(FERN)).toEqual({
        name: "Bulbasaur's fern",
        description: 'Likes shade.',
        tags: ['Living room'],
        tagDraft: '',
        summerIntervalDays: '7',
        winterIntervalDays: '14',
        photo: { kind: 'keep' },
      });
    });

    it('should leave the description empty when the plant has none', () => {
      // When / Then
      expect(formValuesOf({ ...FERN, description: null }).description).toBe('');
    });
  });

  describe('validateFormFields', () => {
    it('should find nothing wrong with valid values', () => {
      // When / Then
      expect(errorsIn(VALID)).toEqual({});
    });

    it('should require a name that is not blank', () => {
      // When / Then
      expect(errorsIn({ ...VALID, name: '   ' })).toEqual({ name: 'nameRequired' });
    });

    it('should refuse a name longer than 60 characters', () => {
      // When / Then
      expect(errorsIn({ ...VALID, name: 'a'.repeat(61) })).toEqual({ name: 'nameTooLong' });
    });

    it('should accept a 60-character name with spaces around it', () => {
      // When / Then
      expect(errorsIn({ ...VALID, name: ` ${'a'.repeat(60)} ` })).toEqual({});
    });

    it('should refuse a description longer than 1000 characters', () => {
      // When / Then
      expect(errorsIn({ ...VALID, description: 'a'.repeat(1001) })).toEqual({
        description: 'descriptionTooLong',
      });
    });

    it.each(['0', '366', '1.5', '', '-1', '1e2'])('should refuse an interval of "%s"', (days) => {
      // When / Then
      expect(errorsIn({ ...VALID, summerIntervalDays: days, winterIntervalDays: days })).toEqual({
        summerIntervalDays: 'intervalInvalid',
        winterIntervalDays: 'intervalInvalid',
      });
    });

    it.each(['1', '365'])('should accept an interval of %s days', (days) => {
      // When / Then
      expect(errorsIn({ ...VALID, summerIntervalDays: days })).toEqual({});
    });
  });

  describe('errorsOf', () => {
    it('should keep only the fields with an error', () => {
      // When / Then
      expect(
        errorsOf([
          ['name', 'nameRequired'],
          ['description', undefined],
        ]),
      ).toEqual({ name: 'nameRequired' });
    });
  });

  describe('hasErrors', () => {
    it('should tell when there is an error', () => {
      // When / Then
      expect(hasErrors({ name: 'nameRequired' })).toBe(true);
    });

    it('should tell when there is none', () => {
      // When / Then
      expect(hasErrors({})).toBe(false);
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

  describe('shownPhoto', () => {
    it('should show the chosen photo', () => {
      // When / Then
      expect(shownPhoto({ kind: 'replace', jpeg: '/9j/AAAA' }, '/fern.jpg')).toBe(
        'data:image/jpeg;base64,/9j/AAAA',
      );
    });

    it('should show no photo once it is removed', () => {
      // When / Then
      expect(shownPhoto({ kind: 'remove' }, '/fern.jpg')).toBeNull();
    });

    it('should show the saved photo while it is kept', () => {
      // When / Then
      expect(shownPhoto({ kind: 'keep' }, '/fern.jpg')).toBe('/fern.jpg');
    });

    it('should show no photo when there is none to keep', () => {
      // When / Then
      expect(shownPhoto({ kind: 'keep' }, null)).toBeNull();
    });
  });

  describe('toFields', () => {
    it('should send the trimmed values', () => {
      // When / Then
      expect(
        toFields({
          ...VALID,
          name: "  Bulbasaur's fern ",
          description: ' Likes shade.\nMist it. ',
          tags: ['Shade'],
          tagDraft: 'Not added',
        }),
      ).toEqual({
        name: "Bulbasaur's fern",
        description: 'Likes shade.\nMist it.',
        tags: ['Shade'],
        summerIntervalDays: 7,
        winterIntervalDays: 14,
      });
    });

    it('should send no description when it is blank', () => {
      // When / Then
      expect(toFields({ ...VALID, description: '  ' }).description).toBeNull();
    });
  });
});
