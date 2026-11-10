import type { ErrorRequestHandler } from 'express';
import { logger } from '../logger.ts';
import { HTTP_STATUS } from './status.ts';

const INVALID_JSON_RESPONSE = { error: 'Invalid request body' };
const INTERNAL_ERROR_RESPONSE = { error: 'Internal error' };

function isClientError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number' &&
    error.status >= HTTP_STATUS.BAD_REQUEST &&
    error.status < HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
}

export const apiErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  // Express can no longer change a response that has started, so it closes the connection.
  if (res.headersSent) {
    next(error);
    return;
  }
  if (isClientError(error)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(INVALID_JSON_RESPONSE);
    return;
  }
  logger.error('Unhandled error in an API request', error);
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(INTERNAL_ERROR_RESPONSE);
};
