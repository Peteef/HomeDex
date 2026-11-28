import { Router } from 'express';
import { z } from 'zod';
import { domainErrorHandler } from '#platform/backend';
import { BAD_REQUEST, CREATED, definedProps, NO_CONTENT } from '#platform/shared';
import { PlantError } from '../domain/plants/index.ts';
import type { PlantsService } from '../domain/plants/index.ts';
import { isCalendarDate } from '../domain/schedule/index.ts';
import { rejectUnknownPlantId } from './params.ts';

const INVALID_PLANT_RESPONSE = { error: 'Invalid plant' };
const JPEG_TYPE = 'image/jpeg';
// The URL carries the photo's id and a new photo gets a new id, so a photo never changes.
const PHOTO_CACHE_CONTROL = 'private, max-age=31536000, immutable';

const dateSchema = z.string().refine(isCalendarDate);

const plantFieldsSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  tags: z.array(z.string()),
  summerIntervalDays: z.number(),
  winterIntervalDays: z.number(),
  photo: z.string().nullable().optional(),
});

const newPlantSchema = plantFieldsSchema.extend({ lastWateredOn: dateSchema });
const plantChangesSchema = plantFieldsSchema.extend({ nextWateringOn: dateSchema });

export interface PlantsRoutesOptions {
  plants: PlantsService;
}

export const plantsRoutes = ({ plants }: PlantsRoutesOptions): Router => {
  const router = Router();
  router.param('id', rejectUnknownPlantId);

  router.get('/plants', (_req, res) => {
    res.json(plants.list());
  });

  router.get('/plants/:id', (req, res) => {
    res.json(plants.get(Number(req.params.id)));
  });

  router.post('/plants', (req, res) => {
    const body = newPlantSchema.safeParse(req.body);

    if (!body.success) {
      res.status(BAD_REQUEST).json(INVALID_PLANT_RESPONSE);
      return;
    }

    const { photo, ...plant } = body.data;
    res.status(CREATED).json({ plant: plants.create({ ...plant, ...definedProps({ photo }) }) });
  });

  router.put('/plants/:id', (req, res) => {
    const body = plantChangesSchema.safeParse(req.body);

    if (!body.success) {
      res.status(BAD_REQUEST).json(INVALID_PLANT_RESPONSE);
      return;
    }

    const { photo, ...changes } = body.data;
    plants.edit(Number(req.params.id), { ...changes, ...definedProps({ photo }) });
    res.status(NO_CONTENT).end();
  });

  router.get('/plants/:id/photo', (req, res) => {
    const { jpeg } = plants.photo(Number(req.params.id));
    res.type(JPEG_TYPE).set('Cache-Control', PHOTO_CACHE_CONTROL).send(jpeg);
  });

  router.delete('/plants/:id', (req, res) => {
    plants.remove(Number(req.params.id));
    res.status(NO_CONTENT).end();
  });

  router.use(domainErrorHandler(PlantError));
  return router;
};
