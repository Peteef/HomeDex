import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 10;
export const TOO_MANY_ATTEMPTS_RESPONSE = { error: 'Too many failed attempts, try again later' };

export interface LoginLimit {
  windowMs: number;
  maxFailedAttempts: number;
}

export const DEFAULT_LOGIN_LIMIT: LoginLimit = {
  windowMs: WINDOW_MS,
  maxFailedAttempts: MAX_FAILED_ATTEMPTS,
};

export function loginRateLimit({
  windowMs,
  maxFailedAttempts,
}: LoginLimit = DEFAULT_LOGIN_LIMIT): RequestHandler {
  return rateLimit({
    windowMs,
    limit: maxFailedAttempts,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: TOO_MANY_ATTEMPTS_RESPONSE,
  });
}
