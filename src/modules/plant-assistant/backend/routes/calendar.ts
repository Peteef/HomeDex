import { Router } from 'express';
import { z } from 'zod';
import { domainErrorHandler } from '#platform/backend';
import { BAD_REQUEST } from '#platform/shared';
import { CalendarError } from '../domain/calendar/index.ts';
import type { CalendarService } from '../domain/calendar/index.ts';

const INVALID_MONTH_RESPONSE = { error: 'Invalid month' };

const calendarQuerySchema = z.object({ month: z.string().optional() });

export interface CalendarRoutesOptions {
  calendar: CalendarService;
}

export const calendarRoutes = ({ calendar }: CalendarRoutesOptions): Router => {
  const router = Router();

  router.get('/calendar', (req, res) => {
    const query = calendarQuerySchema.safeParse(req.query);

    if (!query.success) {
      res.status(BAD_REQUEST).json(INVALID_MONTH_RESPONSE);
      return;
    }

    res.json(calendar.month(query.data.month));
  });

  router.use(domainErrorHandler(CalendarError));
  return router;
};
