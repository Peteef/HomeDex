import { Router } from 'express';
import type { Request } from 'express';
import { z } from 'zod';
import { domainErrorHandler } from '#platform/backend';
import type { CurrentUser } from '#platform/backend';
import { BAD_REQUEST, CREATED, NO_CONTENT } from '#platform/shared';
import { isCalendarDate } from '../domain/schedule/index.ts';
import { WateringError } from '../domain/watering/index.ts';
import type { WateringService } from '../domain/watering/index.ts';
import { rejectUnknownPlantId, rejectUnknownWateringId } from './params.ts';

const INVALID_UNDO_RESPONSE = { error: 'Invalid undo' };
const INVALID_POSTPONE_RESPONSE = { error: 'Invalid postpone' };

const dateSchema = z.string().refine(isCalendarDate);

const undoSchema = z.object({
  previous: z.object({
    lastWateredOn: dateSchema,
    nextWateringOn: dateSchema,
  }),
});

const postponeSchema = z.object({ days: z.number() });

export interface WateringRoutesOptions {
  watering: WateringService;
  currentUser: (req: Request) => CurrentUser;
}

export const wateringRoutes = ({ watering, currentUser }: WateringRoutesOptions): Router => {
  const router = Router();
  router.param('id', rejectUnknownPlantId);
  router.param('wateringId', rejectUnknownWateringId);

  router.post('/plants/:id/waterings', (req, res) => {
    res.status(CREATED).json(watering.water(Number(req.params.id), currentUser(req)));
  });

  router.post('/plants/:id/waterings/:wateringId/undo', (req, res) => {
    const body = undoSchema.safeParse(req.body);

    if (!body.success) {
      res.status(BAD_REQUEST).json(INVALID_UNDO_RESPONSE);
      return;
    }

    watering.undo(Number(req.params.id), Number(req.params.wateringId), body.data.previous);
    res.status(NO_CONTENT).end();
  });

  router.post('/plants/:id/postpone', (req, res) => {
    const body = postponeSchema.safeParse(req.body);

    if (!body.success) {
      res.status(BAD_REQUEST).json(INVALID_POSTPONE_RESPONSE);
      return;
    }

    watering.postpone(Number(req.params.id), body.data.days);
    res.status(NO_CONTENT).end();
  });

  router.use(domainErrorHandler(WateringError));
  return router;
};
