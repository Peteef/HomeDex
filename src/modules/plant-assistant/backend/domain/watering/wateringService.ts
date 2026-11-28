import type { CurrentUser, Storage } from '#platform/backend';
import { plantRepository } from '../plants/index.ts';
import type { PlantDates, StoredPlant } from '../plants/index.ts';
import { addDays, daysBetween, nextWateringAfter } from '../schedule/index.ts';
import {
  invalidWatering,
  plantNotDue,
  plantNotFound,
  undoUnavailable,
  wateringNotFound,
} from './errors.ts';
import { wateringEventRepository } from './internal/wateringEventRepository.ts';
import type { StoredWateringEvent } from './internal/wateringEventRepository.ts';
import type { Watering } from './types.ts';

const MIN_POSTPONE_DAYS = 1;
const MAX_POSTPONE_DAYS = 30;

export interface WateringService {
  water(plantId: number, user: CurrentUser): Watering;
  undo(plantId: number, wateringId: number, previous: PlantDates): void;
  postpone(plantId: number, days: number): void;
}

export interface WateringServiceOptions {
  today: () => string;
}

const isDue = (plant: StoredPlant, today: string): boolean =>
  daysBetween(today, plant.nextWateringOn) <= 0;

// The plant was due before the watering, so its last watering was before today and its next one
// on or before today.
const isPossibleBeforeWatering = (previous: PlantDates, today: string): boolean =>
  daysBetween(today, previous.lastWateredOn) < 0 &&
  daysBetween(today, previous.nextWateringOn) <= 0;

const isPostponeDays = (days: number): boolean =>
  Number.isInteger(days) && days >= MIN_POSTPONE_DAYS && days <= MAX_POSTPONE_DAYS;

export const wateringService = (
  db: Storage,
  { today }: WateringServiceOptions,
): WateringService => {
  const plants = plantRepository(db);
  const events = wateringEventRepository(db);

  const requirePlant = (id: number): StoredPlant => {
    const plant = plants.find(id);

    if (plant === undefined) {
      throw plantNotFound(id);
    }

    return plant;
  };

  const requireDuePlant = (id: number, day: string): StoredPlant => {
    const plant = requirePlant(id);

    if (!isDue(plant, day)) {
      throw plantNotDue(id);
    }

    return plant;
  };

  const requireWatering = (plantId: number, id: number): StoredWateringEvent => {
    const watering = events.find(plantId, id);

    if (watering === undefined) {
      throw wateringNotFound(id);
    }

    return watering;
  };

  // Undo only reverts what the watering itself did: anything that happened to the plant since
  // (another watering, a postpone, an edit, a new day) makes the previous dates stale.
  const isUndoable = (plant: StoredPlant, watering: StoredWateringEvent, day: string): boolean =>
    events.newestOf(plant.id)?.id === watering.id &&
    watering.wateredOn === day &&
    plant.lastWateredOn === day &&
    plant.nextWateringOn === nextWateringAfter(plant, day);

  const water = (plantId: number, user: CurrentUser): Watering => {
    const day = today();
    const plant = requireDuePlant(plantId, day);

    const wateringId = db.transaction(() => {
      const id = events.insert({
        plantId,
        wateredOn: day,
        accountId: user.id,
        username: user.username,
      });

      plants.setDates(plantId, {
        lastWateredOn: day,
        nextWateringOn: nextWateringAfter(plant, day),
      });

      return id;
    })();

    return {
      wateringId,
      previous: {
        lastWateredOn: plant.lastWateredOn,
        nextWateringOn: plant.nextWateringOn,
      },
    };
  };

  const undo = (plantId: number, wateringId: number, previous: PlantDates): void => {
    const day = today();

    if (!isPossibleBeforeWatering(previous, day)) {
      throw invalidWatering('The dates before the watering are not possible');
    }

    const plant = requirePlant(plantId);
    const watering = requireWatering(plantId, wateringId);

    if (!isUndoable(plant, watering, day)) {
      throw undoUnavailable(wateringId);
    }

    db.transaction(() => {
      plants.setDates(plantId, previous);
      events.remove(wateringId);
    })();
  };

  const postpone = (plantId: number, days: number): void => {
    if (!isPostponeDays(days)) {
      throw invalidWatering(
        `A postpone is not a whole number of days from ${String(MIN_POSTPONE_DAYS)} to ${String(MAX_POSTPONE_DAYS)}`,
      );
    }

    const day = today();
    const plant = requireDuePlant(plantId, day);

    plants.setDates(plantId, {
      lastWateredOn: plant.lastWateredOn,
      nextWateringOn: addDays(day, days),
    });
  };

  return {
    water,
    undo,
    postpone,
  };
};
