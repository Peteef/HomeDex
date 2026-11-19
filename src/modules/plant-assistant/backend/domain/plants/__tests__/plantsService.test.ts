import path from 'node:path';
import { moduleTestStorage } from '#platform/backend/testing';
import { describe, expect, it } from 'vitest';
import { PlantError, plantsService } from '../index.ts';
import type { NewPlant, PlantChanges } from '../index.ts';

const MODULE_DIR = path.resolve(import.meta.dirname, '../../../..');

const FERN: NewPlant = {
  name: "Bulbasaur's fern",
  description: 'Likes shade',
  tags: ['Salon'],
  summerIntervalDays: 7,
  winterIntervalDays: 30,
  lastWateredOn: '2026-06-01',
};

const newService = (initialToday = '2026-06-03') => {
  let today = initialToday;

  const service = plantsService(moduleTestStorage(MODULE_DIR), { today: () => today });

  const moveTo = (day: string) => {
    today = day;
  };

  return {
    service,
    moveTo,
  };
};

const changesOf = (plant: NewPlant, nextWateringOn: string): PlantChanges => ({
  name: plant.name,
  description: plant.description,
  tags: plant.tags,
  summerIntervalDays: plant.summerIntervalDays,
  winterIntervalDays: plant.winterIntervalDays,
  nextWateringOn,
});

const errorOf = (action: () => unknown): PlantError => {
  try {
    action();
  } catch (error) {
    if (error instanceof PlantError) {
      return error;
    }

    throw error;
  }

  throw new Error('Expected a PlantError');
};

describe('plants service', () => {
  describe('create', () => {
    it('should store the plant and plan the next watering from the last one', () => {
      // Given
      const { service } = newService();

      // When
      const plant = service.create(FERN);

      // Then
      expect(plant).toEqual({
        id: plant.id,
        name: "Bulbasaur's fern",
        description: 'Likes shade',
        tags: ['Salon'],
        photoId: null,
        lastWateredOn: '2026-06-01',
        nextWateringOn: '2026-06-08',
        daysUntil: 5,
        urgency: 'later',
        summerIntervalDays: 7,
        winterIntervalDays: 30,
        currentSeason: 'summer',
      });
    });

    it('should use the interval of the season of the last watering', () => {
      // Given
      const { service } = newService('2026-04-05');

      // When
      const plant = service.create({ ...FERN, lastWateredOn: '2026-03-20' });

      // Then
      expect(plant.nextWateringOn).toBe('2026-04-19');
    });

    it('should make the plant overdue at once when the last watering was long ago', () => {
      // Given
      const { service } = newService();

      // When
      const plant = service.create({ ...FERN, lastWateredOn: '2026-05-01' });

      // Then
      expect(plant).toMatchObject({
        nextWateringOn: '2026-05-08',
        daysUntil: -26,
        urgency: 'overdue',
      });
    });

    it('should accept a last watering today', () => {
      // Given
      const { service } = newService();

      // When
      const plant = service.create({ ...FERN, lastWateredOn: '2026-06-03' });

      // Then
      expect(plant.lastWateredOn).toBe('2026-06-03');
    });

    it('should reject a last watering when it is in the future', () => {
      // Given
      const { service } = newService();

      // When
      const error = errorOf(() => service.create({ ...FERN, lastWateredOn: '2026-06-04' }));

      // Then
      expect(error.code).toBe('invalid');
    });

    it('should trim the name and store an empty description as none', () => {
      // Given
      const { service } = newService();

      // When
      const plant = service.create({ ...FERN, name: '  Oddish  ', description: '  ' });

      // Then
      expect(plant).toMatchObject({ name: 'Oddish', description: null });
    });

    it('should keep one spelling of tags that differ only in case or spaces', () => {
      // Given
      const { service } = newService();

      // When
      const plant = service.create({ ...FERN, tags: ['Salon', 'salon ', ' ', 'Żółw', 'zolw'] });

      // Then
      expect(plant.tags).toEqual(['Salon', 'Żółw']);
    });

    it.each([
      ['an empty name', { name: '   ' }],
      ['a name over 60 characters', { name: 'a'.repeat(61) }],
      ['a description over 1000 characters', { description: 'a'.repeat(1001) }],
      ['a tag over 30 characters', { tags: ['a'.repeat(31)] }],
      [
        'more than 10 tags',
        { tags: Array.from({ length: 11 }, (_, index) => `Tag ${String(index)}`) },
      ],
      ['an interval of 0 days', { summerIntervalDays: 0 }],
      ['an interval over 365 days', { winterIntervalDays: 366 }],
      ['an interval that is not whole days', { summerIntervalDays: 1.5 }],
    ])('should reject %s', (_case, change) => {
      // Given
      const { service } = newService();

      // When
      const error = errorOf(() => service.create({ ...FERN, ...change }));

      // Then
      expect(error.code).toBe('invalid');
      expect(service.list().plants).toEqual([]);
    });

    it('should accept the limits', () => {
      // Given
      const { service } = newService();

      // When
      const plant = service.create({
        ...FERN,
        name: 'a'.repeat(60),
        description: 'a'.repeat(1000),
        tags: Array.from({ length: 10 }, (_, index) => `${String(index)}${'a'.repeat(29)}`),
        summerIntervalDays: 1,
        winterIntervalDays: 365,
      });

      // Then
      expect(plant.tags).toHaveLength(10);
    });
  });

  describe('list', () => {
    it('should give today and each plant with its days until watering and urgency', () => {
      // Given
      const { service } = newService();
      const fern = service.create(FERN);

      // When
      const list = service.list();

      // Then
      expect(list).toEqual({
        today: '2026-06-03',
        plants: [
          {
            id: fern.id,
            name: "Bulbasaur's fern",
            description: 'Likes shade',
            tags: ['Salon'],
            photoId: null,
            lastWateredOn: '2026-06-01',
            nextWateringOn: '2026-06-08',
            daysUntil: 5,
            urgency: 'later',
          },
        ],
      });
    });

    it('should follow a change of today without any write', () => {
      // Given
      const { service, moveTo } = newService();
      service.create(FERN);

      // When
      moveTo('2026-06-10');

      // Then
      expect(service.list().plants[0]).toMatchObject({ daysUntil: -2, urgency: 'overdue' });
    });
  });

  describe('get', () => {
    it('should give the plant with the season of today', () => {
      // Given
      const { service, moveTo } = newService();
      const fern = service.create(FERN);
      moveTo('2026-11-02');

      // When
      const view = service.get(fern.id);

      // Then
      expect(view.today).toBe('2026-11-02');

      expect(view.plant).toMatchObject({
        id: fern.id,
        currentSeason: 'winter',
        urgency: 'overdue',
      });
    });

    it('should reject an unknown plant', () => {
      // When
      const error = errorOf(() => newService().service.get(42));

      // Then
      expect(error.code).toBe('not_found');
    });
  });

  describe('edit', () => {
    it('should replace the name, description, tags and intervals', () => {
      // Given
      const { service } = newService();
      const fern = service.create(FERN);

      // When
      service.edit(fern.id, {
        name: 'Oddish',
        description: null,
        tags: ['Balcony'],
        summerIntervalDays: 3,
        winterIntervalDays: 10,
        nextWateringOn: '2026-06-08',
      });

      // Then
      expect(service.get(fern.id).plant).toMatchObject({
        name: 'Oddish',
        description: null,
        tags: ['Balcony'],
        summerIntervalDays: 3,
        winterIntervalDays: 10,
        lastWateredOn: '2026-06-01',
        nextWateringOn: '2026-06-08',
      });
    });

    it('should not recompute the next watering when the intervals change', () => {
      // Given
      const { service } = newService();
      const fern = service.create(FERN);

      // When
      service.edit(fern.id, { ...changesOf(FERN, '2026-06-08'), summerIntervalDays: 2 });

      // Then
      expect(service.get(fern.id).plant.nextWateringOn).toBe('2026-06-08');
    });

    it('should move the next watering to a later day', () => {
      // Given
      const { service } = newService();
      const fern = service.create(FERN);

      // When
      service.edit(fern.id, changesOf(FERN, '2026-06-20'));

      // Then
      expect(service.get(fern.id).plant.nextWateringOn).toBe('2026-06-20');
    });

    it('should accept a changed next watering today', () => {
      // Given
      const { service } = newService();
      const fern = service.create(FERN);

      // When
      service.edit(fern.id, changesOf(FERN, '2026-06-03'));

      // Then
      expect(service.get(fern.id).plant.urgency).toBe('today');
    });

    it('should keep a past next watering when it is not changed', () => {
      // Given
      const { service, moveTo } = newService();
      const fern = service.create(FERN);
      moveTo('2026-06-12');

      // When
      service.edit(fern.id, { ...changesOf(FERN, '2026-06-08'), name: 'Oddish' });

      // Then
      expect(service.get(fern.id).plant).toMatchObject({
        name: 'Oddish',
        nextWateringOn: '2026-06-08',
        urgency: 'overdue',
      });
    });

    it('should reject a changed next watering when it is in the past', () => {
      // Given
      const { service } = newService();
      const fern = service.create(FERN);

      // When
      const error = errorOf(() => {
        service.edit(fern.id, changesOf(FERN, '2026-06-02'));
      });

      // Then
      expect(error.code).toBe('invalid');
      expect(service.get(fern.id).plant.nextWateringOn).toBe('2026-06-08');
    });

    it('should reject invalid fields', () => {
      // Given
      const { service } = newService();
      const fern = service.create(FERN);

      // When
      const error = errorOf(() => {
        service.edit(fern.id, { ...changesOf(FERN, '2026-06-08'), name: '' });
      });

      // Then
      expect(error.code).toBe('invalid');
    });

    it('should reject an unknown plant', () => {
      // When
      const error = errorOf(() => {
        newService().service.edit(42, changesOf(FERN, '2026-06-08'));
      });

      // Then
      expect(error.code).toBe('not_found');
    });
  });

  describe('remove', () => {
    it('should delete the plant', () => {
      // Given
      const { service } = newService();
      const fern = service.create(FERN);

      // When
      service.remove(fern.id);

      // Then
      expect(service.list().plants).toEqual([]);
    });

    it('should reject an unknown plant', () => {
      // When
      const error = errorOf(() => {
        newService().service.remove(42);
      });

      // Then
      expect(error.code).toBe('not_found');
    });
  });

  describe('tags', () => {
    it('should list every tag in use once, sorted', () => {
      // Given
      const { service } = newService();
      service.create({ ...FERN, tags: ['Salon', 'Shade'] });
      service.create({ ...FERN, tags: ['salon', 'Balcony'] });

      // When / Then
      expect(service.tags()).toEqual(['Balcony', 'Salon', 'Shade']);
    });
  });
});
