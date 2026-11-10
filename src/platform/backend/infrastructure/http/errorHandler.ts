import type { ErrorRequestHandler } from 'express';
import { logger } from '../logger.ts';

const HTTP_BAD_REQUEST = 400;
const HTTP_INTERNAL_ERROR = 500;
const INVALID_JSON_RESPONSE = { error: 'Invalid request body' };
const INTERNAL_ERROR_RESPONSE = { error: 'Internal error' };

function isClientError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number' &&
    error.status >= HTTP_BAD_REQUEST &&
    error.status < HTTP_INTERNAL_ERROR
  );
}

export const apiErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  // Express can no longer change a response that has started, so it closes the connection.
  if (res.headersSent) {
    next(error);
    return;
  }
  if (isClientError(error)) {
    res.status(HTTP_BAD_REQUEST).json(INVALID_JSON_RESPONSE);
    return;
  }
  logger.error('Unhandled error in an API request', error);
  res.status(HTTP_INTERNAL_ERROR).json(INTERNAL_ERROR_RESPONSE);
};
