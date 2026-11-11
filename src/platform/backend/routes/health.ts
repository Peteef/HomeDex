import { Router } from 'express';

const HEALTH_RESPONSE = { status: 'ok' };

export const healthRoutes = (): Router => {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(HEALTH_RESPONSE);
  });

  return router;
};
