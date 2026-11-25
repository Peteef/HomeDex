import type { RequestParamHandler } from 'express';
import { z } from 'zod';
import { NOT_FOUND } from '#platform/shared';

const idSchema = z.coerce.number().int().positive();

const rejectInvalidId =
  (error: string): RequestParamHandler =>
  (_req, res, next, id: string) => {
    if (!idSchema.safeParse(id).success) {
      res.status(NOT_FOUND).json({ error });
      return;
    }

    next();
  };

export const rejectUnknownPlantId = rejectInvalidId('Plant not found');

export const rejectUnknownWateringId = rejectInvalidId('Watering not found');
