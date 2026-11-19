import { Router } from 'express';
import type { ErrorRequestHandler, RequestParamHandler } from 'express';
import { z } from 'zod';
import { BAD_REQUEST, CREATED, NO_CONTENT, NOT_FOUND } from '#platform/shared';
import { PlantError } from '../domain/plants/index.ts';
import type { PlantErrorCode, PlantsService } from '../domain/plants/index.ts';
import { isCalendarDate } from '../domain/schedule/index.ts';

const INVALID_PLANT_RESPONSE = { error: 'Invalid plant' };
const PLANT_NOT_FOUND_RESPONSE = { error: 'Plant not found' };

const PLANT_ERROR_STATUS: Record<PlantErrorCode, number> = {
  invalid: BAD_REQUEST,
  not_found: NOT_FOUND,
};

const plantIdSchema = z.coerce.number().int().positive();
const dateSchema = z.string().refine(isCalendarDate);

const plantFieldsSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  tags: z.array(z.string()),
  summerIntervalDays: z.number(),
  winterIntervalDays: z.number(),
});

const newPlantSchema = plantFieldsSchema.extend({ lastWateredOn: dateSchema });
const plantChangesSchema = plantFieldsSchema.extend({ nextWateringOn: dateSchema });

export interface PlantsRoutesOptions {
  plants: PlantsService;
}

const rejectUnknownPlantId: RequestParamHandler = (_req, res, next, id: string) => {
  if (!plantIdSchema.safeParse(id).success) {
    res.status(NOT_FOUND).json(PLANT_NOT_FOUND_RESPONSE);
    return;
  }

  next();
};

const sendPlantErrors: ErrorRequestHandler = (error, _req, res, next) => {
  if (!(error instanceof PlantError)) {
    next(error);
    return;
  }

  res.status(PLANT_ERROR_STATUS[error.code]).json({ error: error.message });
};

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

    res.status(CREATED).json({ plant: plants.create(body.data) });
  });

  router.put('/plants/:id', (req, res) => {
    const body = plantChangesSchema.safeParse(req.body);

    if (!body.success) {
      res.status(BAD_REQUEST).json(INVALID_PLANT_RESPONSE);
      return;
    }

    plants.edit(Number(req.params.id), body.data);
    res.status(NO_CONTENT).end();
  });

  router.delete('/plants/:id', (req, res) => {
    plants.remove(Number(req.params.id));
    res.status(NO_CONTENT).end();
  });

  router.use(sendPlantErrors);
  return router;
};
