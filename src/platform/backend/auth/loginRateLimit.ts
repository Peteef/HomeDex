import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 10;
export const TOO_MANY_ATTEMPTS_RESPONSE = { error: 'Too many failed attempts, try again later' };

export function createLoginRateLimit(): RequestHandler {
  return rateLimit({
    windowMs: WINDOW_MS,
    limit: MAX_FAILED_ATTEMPTS,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: TOO_MANY_ATTEMPTS_RESPONSE,
  });
}
