import type { Request, RequestHandler } from 'express';
import { FORBIDDEN, UNSUPPORTED_MEDIA_TYPE } from './status.ts';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const JSON_TYPE = 'application/json';
export const FOREIGN_ORIGIN_RESPONSE = { error: 'Foreign origin' };
export const JSON_REQUIRED_RESPONSE = { error: 'Content-Type must be application/json' };

const isSameOrigin = (origin: string, req: Request): boolean => {
  try {
    return new URL(origin).host === req.host;
  } catch {
    return false;
  }
};

const isJson = (contentType: string | undefined): boolean => {
  return contentType?.split(';')[0]?.trim().toLowerCase() === JSON_TYPE;
};

// CSRF defence next to SameSite=Lax cookies: browsers always send Origin on cross-site writes
// and cannot send application/json from a plain form. A missing Origin means a non-browser client.
export const requestGuard: RequestHandler = (req, res, next) => {
  if (!MUTATING_METHODS.has(req.method)) {
    next();
    return;
  }
  const origin = req.get('origin');
  if (origin !== undefined && !isSameOrigin(origin, req)) {
    res.status(FORBIDDEN).json(FOREIGN_ORIGIN_RESPONSE);
    return;
  }
  if (!isJson(req.get('content-type'))) {
    res.status(UNSUPPORTED_MEDIA_TYPE).json(JSON_REQUIRED_RESPONSE);
    return;
  }
  next();
};
