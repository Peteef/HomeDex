import { Router } from 'express';
import type { ErrorRequestHandler, RequestParamHandler } from 'express';
import { z } from 'zod';
import { TILE_SCOPES, TileError } from '../domain/tiles/index.ts';
import type { TileErrorCode, TilesService } from '../domain/tiles/index.ts';
import { currentUser } from '../infrastructure/http/auth/currentUser.ts';
import {
  BAD_REQUEST,
  CREATED,
  FORBIDDEN,
  NO_CONTENT,
  NOT_FOUND,
} from '../../shared/http/status.ts';

const INVALID_TILE_RESPONSE = { error: 'Invalid tile' };
const TILE_NOT_FOUND_RESPONSE = { error: 'Tile not found' };

const TILE_ERROR_STATUS: Record<TileErrorCode, number> = {
  invalid: BAD_REQUEST,
  not_found: NOT_FOUND,
  forbidden: FORBIDDEN,
};

const tileIdSchema = z.coerce.number().int().positive();

const newTileSchema = z.object({
  title: z.string(),
  url: z.string(),
  icon: z.string(),
  scope: z.enum(TILE_SCOPES),
  description: z.string().nullable().exactOptional(),
});

const tileEditSchema = z.object({
  title: z.string().exactOptional(),
  url: z.string().exactOptional(),
  icon: z.string().exactOptional(),
  scope: z.enum(TILE_SCOPES).exactOptional(),
  description: z.string().nullable().exactOptional(),
});

export interface TilesRoutesOptions {
  tiles: TilesService;
}

const rejectUnknownTileId: RequestParamHandler = (_req, res, next, id: string) => {
  if (!tileIdSchema.safeParse(id).success) {
    res.status(NOT_FOUND).json(TILE_NOT_FOUND_RESPONSE);
    return;
  }

  next();
};

const sendTileErrors: ErrorRequestHandler = (error, _req, res, next) => {
  if (!(error instanceof TileError)) {
    next(error);
    return;
  }

  res.status(TILE_ERROR_STATUS[error.code]).json({ error: error.message });
};

export const tilesRoutes = ({ tiles }: TilesRoutesOptions): Router => {
  const router = Router();
  router.param('id', rejectUnknownTileId);

  router.get('/', (req, res) => {
    res.json({ tiles: tiles.list(currentUser(req).id) });
  });

  router.post('/', (req, res) => {
    const body = newTileSchema.safeParse(req.body);

    if (!body.success) {
      res.status(BAD_REQUEST).json(INVALID_TILE_RESPONSE);
      return;
    }

    res.status(CREATED).json({ tile: tiles.create(currentUser(req).id, body.data) });
  });

  router.patch('/:id', (req, res) => {
    const body = tileEditSchema.safeParse(req.body);

    if (!body.success) {
      res.status(BAD_REQUEST).json(INVALID_TILE_RESPONSE);
      return;
    }

    res.json({ tile: tiles.edit(currentUser(req).id, Number(req.params.id), body.data) });
  });

  router.delete('/:id', (req, res) => {
    tiles.remove(currentUser(req).id, Number(req.params.id));
    res.status(NO_CONTENT).end();
  });

  router.put('/:id/pin', (req, res) => {
    tiles.pin(currentUser(req).id, Number(req.params.id));
    res.status(NO_CONTENT).end();
  });

  router.delete('/:id/pin', (req, res) => {
    tiles.unpin(currentUser(req).id, Number(req.params.id));
    res.status(NO_CONTENT).end();
  });

  router.use(sendTileErrors);
  return router;
};
