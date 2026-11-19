import { Router } from 'express';
import type { Request, RequestParamHandler } from 'express';
import { z } from 'zod';
import { domainErrorHandler } from '#platform/backend';
import type { CurrentUser } from '#platform/backend';
import { BAD_REQUEST, CREATED, NO_CONTENT, NOT_FOUND } from '#platform/shared';
import { ItemError } from '../domain/items/index.ts';
import type { ItemsService } from '../domain/items/index.ts';

const INVALID_ITEM_RESPONSE = { error: 'Invalid item' };
const ITEM_NOT_FOUND_RESPONSE = { error: 'Item not found' };

const itemIdSchema = z.coerce.number().int().positive();

const newItemSchema = z.object({
  text: z.string(),
  amount: z.string().exactOptional(),
});

export interface ItemsRoutesOptions {
  items: ItemsService;
  currentUser: (req: Request) => CurrentUser;
}

const rejectUnknownItemId: RequestParamHandler = (_req, res, next, id: string) => {
  if (!itemIdSchema.safeParse(id).success) {
    res.status(NOT_FOUND).json(ITEM_NOT_FOUND_RESPONSE);
    return;
  }

  next();
};

export const itemsRoutes = ({ items, currentUser }: ItemsRoutesOptions): Router => {
  const router = Router();
  router.param('id', rejectUnknownItemId);

  router.get('/items', (_req, res) => {
    res.json({ items: items.list() });
  });

  router.post('/items', (req, res) => {
    const body = newItemSchema.safeParse(req.body);

    if (!body.success) {
      res.status(BAD_REQUEST).json(INVALID_ITEM_RESPONSE);
      return;
    }

    res.status(CREATED).json({ item: items.add(currentUser(req).username, body.data) });
  });

  router.delete('/items/:id', (req, res) => {
    items.remove(Number(req.params.id));
    res.status(NO_CONTENT).end();
  });

  router.put('/items/:id/check', (req, res) => {
    items.check(Number(req.params.id));
    res.status(NO_CONTENT).end();
  });

  router.delete('/items/:id/check', (req, res) => {
    items.uncheck(Number(req.params.id));
    res.status(NO_CONTENT).end();
  });

  router.delete('/checked-items', (_req, res) => {
    items.clearChecked();
    res.status(NO_CONTENT).end();
  });

  router.use(domainErrorHandler(ItemError));
  return router;
};
