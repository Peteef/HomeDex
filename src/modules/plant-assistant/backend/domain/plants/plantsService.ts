import type { Storage } from '#platform/backend';
import { foldText } from '#platform/shared';
import { z } from 'zod';
import { daysBetween, nextWateringAfter, seasonOf, urgencyOf } from '../schedule/index.ts';
import { invalidPlant, photoNotFound, plantNotFound } from './errors.ts';
import { photoRepository } from './internal/photoRepository.ts';
import type { StoredPhoto } from './internal/photoRepository.ts';
import { plantRepository } from './internal/plantRepository.ts';
import type { StoredPlant } from './internal/plantRepository.ts';
import type {
  NewPlant,
  PlantChanges,
  PlantDetails,
  PlantFields,
  PlantList,
  PlantSummary,
  PlantView,
} from './types.ts';

const NAME_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 1000;
const TAG_MAX_LENGTH = 30;
const MAX_TAGS = 10;
const MIN_INTERVAL_DAYS = 1;
const MAX_INTERVAL_DAYS = 365;
const PHOTO_MAX_KB = 1536;
const BYTES_PER_KB = 1024;
const BASE64_BLOCK_LENGTH = 4;
const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);

export interface PlantsService {
  list(): PlantList;
  get(id: number): PlantView;
  create(plant: NewPlant): PlantDetails;
  edit(id: number, changes: PlantChanges): void;
  remove(id: number): void;
  tags(): string[];
  photo(id: number): StoredPhoto;
  countDue(): number;
}

export interface PlantsServiceOptions {
  today: () => string;
}

const intervalSchema = (season: string) =>
  z
    .number()
    .int(`The ${season} interval is not a whole number of days`)
    .min(
      MIN_INTERVAL_DAYS,
      `The ${season} interval is shorter than ${String(MIN_INTERVAL_DAYS)} day`,
    )
    .max(
      MAX_INTERVAL_DAYS,
      `The ${season} interval is longer than ${String(MAX_INTERVAL_DAYS)} days`,
    );

// Blank tags go, and a tag that folds to one already given (case, diacritics) keeps the first
// spelling.
const distinctTags = (tags: string[]): string[] => {
  const keys = new Set<string>();

  return tags
    .map((tag) => tag.trim())
    .filter((tag) => {
      const key = foldText(tag);

      if (tag === '' || keys.has(key)) {
        return false;
      }

      keys.add(key);
      return true;
    });
};

const plantFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'The name is empty')
    .max(NAME_MAX_LENGTH, `The name is longer than ${String(NAME_MAX_LENGTH)} characters`),
  description: z
    .string()
    .trim()
    .max(
      DESCRIPTION_MAX_LENGTH,
      `The description is longer than ${String(DESCRIPTION_MAX_LENGTH)} characters`,
    )
    .nullable()
    .transform((description) => (description === '' ? null : description)),
  tags: z
    .array(z.string())
    .transform(distinctTags)
    .pipe(
      z
        .array(
          z
            .string()
            .max(TAG_MAX_LENGTH, `A tag is longer than ${String(TAG_MAX_LENGTH)} characters`),
        )
        .max(MAX_TAGS, `There are more than ${String(MAX_TAGS)} tags`),
    ),
  summerIntervalDays: intervalSchema('summer'),
  winterIntervalDays: intervalSchema('winter'),
});

const validate = (fields: PlantFields): PlantFields => {
  const result = plantFieldsSchema.safeParse(fields);

  if (!result.success) {
    throw invalidPlant(result.error.issues[0]?.message ?? 'Invalid plant');
  }

  return result.data;
};

const decodePhoto = (photo: string): Buffer => {
  if (photo.length % BASE64_BLOCK_LENGTH !== 0 || !BASE64.test(photo)) {
    throw invalidPlant('The photo is not base64');
  }

  const jpeg = Buffer.from(photo, 'base64');

  if (!jpeg.subarray(0, JPEG_SIGNATURE.length).equals(JPEG_SIGNATURE)) {
    throw invalidPlant('The photo is not a JPEG');
  }

  if (jpeg.length > PHOTO_MAX_KB * BYTES_PER_KB) {
    throw invalidPlant(`The photo is larger than ${String(PHOTO_MAX_KB)} kB`);
  }

  return jpeg;
};

// Left out, the photo stays (undefined); null removes it; otherwise the decoded JPEG replaces it.
const decodedPhoto = (photo: string | null | undefined): Buffer | null | undefined =>
  typeof photo === 'string' ? decodePhoto(photo) : photo;

const summaryOf = (plant: StoredPlant, today: string): PlantSummary => {
  const daysUntil = daysBetween(today, plant.nextWateringOn);

  return {
    id: plant.id,
    name: plant.name,
    description: plant.description,
    tags: plant.tags,
    photoId: plant.photoId,
    lastWateredOn: plant.lastWateredOn,
    nextWateringOn: plant.nextWateringOn,
    daysUntil,
    urgency: urgencyOf(daysUntil),
  };
};

const detailsOf = (plant: StoredPlant, today: string): PlantDetails => ({
  ...summaryOf(plant, today),
  summerIntervalDays: plant.summerIntervalDays,
  winterIntervalDays: plant.winterIntervalDays,
  currentSeason: seasonOf(today),
});

export const plantsService = (db: Storage, { today }: PlantsServiceOptions): PlantsService => {
  const plants = plantRepository(db);
  const photos = photoRepository(db);

  const savePhoto = (plantId: number, jpeg: Buffer | null | undefined): void => {
    if (jpeg === null) {
      photos.remove(plantId);
    } else if (jpeg !== undefined) {
      photos.replace(plantId, jpeg);
    }
  };

  const requirePlant = (id: number): StoredPlant => {
    const plant = plants.find(id);

    if (plant === undefined) {
      throw plantNotFound(id);
    }

    return plant;
  };

  const list = (): PlantList => {
    const day = today();
    return {
      today: day,
      plants: plants.list().map((plant) => summaryOf(plant, day)),
    };
  };

  const get = (id: number): PlantView => {
    const day = today();
    return {
      today: day,
      plant: detailsOf(requirePlant(id), day),
    };
  };

  const create = ({ lastWateredOn, photo, ...fields }: NewPlant): PlantDetails => {
    const day = today();
    const valid = validate(fields);
    const jpeg = decodedPhoto(photo);

    if (daysBetween(day, lastWateredOn) > 0) {
      throw invalidPlant('The last watering is in the future');
    }

    const id = db.transaction(() => {
      const created = plants.insert({
        ...valid,
        lastWateredOn,
        nextWateringOn: nextWateringAfter(valid, lastWateredOn),
      });

      savePhoto(created, jpeg);
      return created;
    })();

    return detailsOf(requirePlant(id), day);
  };

  // A changed next watering must not be in the past; an unchanged one stays even when it is,
  // so editing an overdue plant's name keeps it overdue.
  const edit = (id: number, { nextWateringOn, photo, ...fields }: PlantChanges): void => {
    const valid = validate(fields);
    const jpeg = decodedPhoto(photo);
    const current = requirePlant(id);

    if (nextWateringOn !== current.nextWateringOn && daysBetween(today(), nextWateringOn) < 0) {
      throw invalidPlant('The next watering is in the past');
    }

    db.transaction(() => {
      plants.update(id, { ...valid, lastWateredOn: current.lastWateredOn, nextWateringOn });
      savePhoto(id, jpeg);
    })();
  };

  const remove = (id: number): void => {
    plants.remove(id);
  };

  const tags = (): string[] => plants.tags();

  const countDue = (): number => plants.countDue(today());

  const photo = (id: number): StoredPhoto => {
    requirePlant(id);
    const stored = photos.find(id);

    if (stored === undefined) {
      throw photoNotFound(id);
    }

    return stored;
  };

  return {
    list,
    get,
    create,
    edit,
    remove,
    tags,
    photo,
    countDue,
  };
};
