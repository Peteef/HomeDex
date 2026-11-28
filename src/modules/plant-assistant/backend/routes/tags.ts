import { Router } from 'express';
import type { PlantsService } from '../domain/plants/index.ts';

export interface TagsRoutesOptions {
  plants: PlantsService;
}

export const tagsRoutes = ({ plants }: TagsRoutesOptions): Router => {
  const router = Router();

  router.get('/tags', (_req, res) => {
    res.json({ tags: plants.tags() });
  });

  return router;
};
