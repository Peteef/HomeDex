import path from 'node:path';
import { moduleTestStorage } from '#platform/backend/testing';
import { describe, expect, it } from 'vitest';
import { plantRepository } from '../../plants/index.ts';
import { WateringError, wateringService } from '../index.ts';
import { wateringEventRepository } from '../internal/wateringEventRepository.ts';

const MODULE_DIR = path.resolve(import.meta.dirname, '../../../..');

const MISTY = { id: 1, username: 'Misty' };

const FERN = {
  name: "Bulbasaur's fern",
  description: null,
  tags: [],
  summerIntervalDays: 7,
  winterIntervalDays: 30,
  lastWateredOn: '2026-06-01',
  nextWateringOn: '2026-06-08',
};

const newService = (initialToday = '2026-06-08') => {
  let today = initialToday;
  const storage = moduleTestStorage(MODULE_DIR);
  const plants = plantRepository(storage);

  const moveTo = (day: string) => {
    today = day;
  };

  const eventsOf = (plantId: number) =>
    storage
      .prepare(
        'SELECT plant_id, watered_on, account_id, username FROM plant_assistant_watering_events WHERE plant_id = ?',
      )
      .all(plantId);

  return {
    service: wateringService(storage, { today: () => today }),
    plants,
    events: wateringEventRepository(storage),
    moveTo,
    eventsOf,
  };
};

const errorOf = (action: () => unknown): WateringError => {
  try {
    action();
  } catch (error) {
    if (error instanceof WateringError) {
      return error;
    }

    throw error;
  }

  throw new Error('Expected a WateringError');
};

describe('watering service', () => {
  describe('water', () => {
    it('should plan the next watering from today and record who watered', () => {
      // Given
      const { service, plants, eventsOf } = newService();
      const id = plants.insert(FERN);

      // When
      const watering = service.water(id, MISTY);

      // Then
      expect(watering).toEqual({
        wateringId: 1,
        previous: { lastWateredOn: '2026-06-01', nextWateringOn: '2026-06-08' },
      });

      expect(plants.find(id)).toMatchObject({
        lastWateredOn: '2026-06-08',
        nextWateringOn: '2026-06-15',
      });

      expect(eventsOf(id)).toEqual([
        { plant_id: id, watered_on: '2026-06-08', account_id: 1, username: 'Misty' },
      ]);
    });

    it('should count from today when the plant is watered late', () => {
      // Given
      const { service, plants } = newService('2026-06-11');
      const id = plants.insert(FERN);

      // When
      service.water(id, MISTY);

      // Then
      expect(plants.find(id)).toMatchObject({
        lastWateredOn: '2026-06-11',
        nextWateringOn: '2026-06-18',
      });
    });

    it('should use the interval of the season the watering falls in', () => {
      // Given
      const { service, plants } = newService('2026-03-31');

      const id = plants.insert({
        ...FERN,
        summerIntervalDays: 5,
        winterIntervalDays: 20,
        lastWateredOn: '2026-03-11',
        nextWateringOn: '2026-03-31',
      });

      // When
      service.water(id, MISTY);

      // Then
      expect(plants.find(id)?.nextWateringOn).toBe('2026-04-20');
    });

    it('should refuse a plant that is not due and record nothing', () => {
      // Given
      const { service, plants, eventsOf } = newService('2026-06-07');
      const id = plants.insert(FERN);

      // When
      const error = errorOf(() => service.water(id, MISTY));

      // Then
      expect(error.code).toBe('conflict');
      expect(plants.find(id)).toMatchObject({ nextWateringOn: '2026-06-08' });
      expect(eventsOf(id)).toEqual([]);
    });

    it('should refuse an unknown plant', () => {
      // Given
      const { service } = newService();

      // When / Then
      expect(errorOf(() => service.water(42, MISTY)).code).toBe('not_found');
    });
  });

  describe('postpone', () => {
    it.each([
      [1, '2026-06-09'],
      [30, '2026-07-08'],
    ])('should move the next watering %i days from today', (days, nextWateringOn) => {
      // Given
      const { service, plants } = newService();
      const id = plants.insert(FERN);

      // When
      service.postpone(id, days);

      // Then
      expect(plants.find(id)).toMatchObject({ lastWateredOn: '2026-06-01', nextWateringOn });
    });

    it('should count from today when the plant is overdue', () => {
      // Given
      const { service, plants } = newService('2026-06-11');
      const id = plants.insert(FERN);

      // When
      service.postpone(id, 2);

      // Then
      expect(plants.find(id)?.nextWateringOn).toBe('2026-06-13');
    });

    it('should record no watering', () => {
      // Given
      const { service, plants, eventsOf } = newService();
      const id = plants.insert(FERN);

      // When
      service.postpone(id, 2);

      // Then
      expect(eventsOf(id)).toEqual([]);
    });

    it.each([0, 31, 1.5])('should refuse %s days', (days) => {
      // Given
      const { service, plants } = newService();
      const id = plants.insert(FERN);

      // When
      const error = errorOf(() => {
        service.postpone(id, days);
      });

      // Then
      expect(error.code).toBe('invalid');
      expect(plants.find(id)?.nextWateringOn).toBe('2026-06-08');
    });

    it('should refuse a plant that is not due', () => {
      // Given
      const { service, plants } = newService('2026-06-07');
      const id = plants.insert(FERN);

      // When
      const error = errorOf(() => {
        service.postpone(id, 2);
      });

      // Then
      expect(error.code).toBe('conflict');
      expect(plants.find(id)?.nextWateringOn).toBe('2026-06-08');
    });

    it('should refuse an unknown plant', () => {
      // Given
      const { service } = newService();

      // When / Then
      expect(
        errorOf(() => {
          service.postpone(42, 2);
        }).code,
      ).toBe('not_found');
    });
  });

  describe('undo', () => {
    const watered = (initialToday?: string) => {
      const context = newService(initialToday);
      const id = context.plants.insert(FERN);
      const { wateringId, previous } = context.service.water(id, MISTY);

      return {
        ...context,
        id,
        wateringId,
        previous,
      };
    };

    it('should restore the dates and delete the watering', () => {
      // Given
      const { service, plants, eventsOf, id, wateringId, previous } = watered();

      // When
      service.undo(id, wateringId, previous);

      // Then
      expect(plants.find(id)).toMatchObject(previous);
      expect(eventsOf(id)).toEqual([]);
    });

    it('should refuse when the plant was rescheduled since', () => {
      // Given
      const { service, plants, id, wateringId, previous } = watered();
      plants.setDates(id, { lastWateredOn: '2026-06-08', nextWateringOn: '2026-06-10' });

      // When
      const error = errorOf(() => {
        service.undo(id, wateringId, previous);
      });

      // Then
      expect(error.code).toBe('conflict');
      expect(plants.find(id)?.nextWateringOn).toBe('2026-06-10');
    });

    it('should refuse when the plant was watered again', () => {
      // Given
      const { service, moveTo, id, wateringId, previous } = watered();
      moveTo('2026-06-15');
      service.water(id, MISTY);

      // When
      const error = errorOf(() => {
        service.undo(id, wateringId, previous);
      });

      // Then
      expect(error.code).toBe('conflict');
    });

    it('should refuse when the watering is not the newest one', () => {
      // Given
      const { service, events, id, wateringId, previous } = watered();
      events.insert({ plantId: id, wateredOn: '2026-06-08', accountId: 2, username: 'Brock' });

      // When
      const error = errorOf(() => {
        service.undo(id, wateringId, previous);
      });

      // Then
      expect(error.code).toBe('conflict');
    });

    it('should refuse when the day changed', () => {
      // Given
      const { service, moveTo, id, wateringId, previous } = watered();
      moveTo('2026-06-09');

      // When
      const error = errorOf(() => {
        service.undo(id, wateringId, previous);
      });

      // Then
      expect(error.code).toBe('conflict');
    });

    it.each([
      ['the last watering is today', { lastWateredOn: '2026-06-08', nextWateringOn: '2026-06-08' }],
      ['the plant was not due', { lastWateredOn: '2026-06-01', nextWateringOn: '2026-06-09' }],
    ])('should refuse previous dates where %s', (_case, previous) => {
      // Given
      const { service, plants, id, wateringId } = watered();

      // When
      const error = errorOf(() => {
        service.undo(id, wateringId, previous);
      });

      // Then
      expect(error.code).toBe('invalid');
      expect(plants.find(id)?.lastWateredOn).toBe('2026-06-08');
    });

    it('should refuse an unknown watering', () => {
      // Given
      const { service, id, wateringId, previous } = watered();

      // When / Then
      expect(
        errorOf(() => {
          service.undo(id, wateringId + 1, previous);
        }).code,
      ).toBe('not_found');
    });

    it('should refuse an unknown plant', () => {
      // Given
      const { service, id, wateringId, previous } = watered();

      // When / Then
      expect(
        errorOf(() => {
          service.undo(id + 1, wateringId, previous);
        }).code,
      ).toBe('not_found');
    });
  });
});
