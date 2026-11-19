import express from 'express';
import type { ErrorRequestHandler } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { domainErrorHandler } from '../domainErrorHandler.ts';
import { apiErrorHandler } from '../errorHandler.ts';

type BerryErrorCode = 'invalid' | 'not_found' | 'forbidden' | 'conflict';

class BerryError extends Error {
  readonly code: BerryErrorCode;

  constructor(code: BerryErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

type TrainerErrorCode = 'invalid' | 'taken';

class TrainerError extends Error {
  readonly code: TrainerErrorCode;

  constructor(code: TrainerErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

class PotionError extends Error {
  readonly code = 'invalid';
}

// The app's own error handler follows, so an error passed on ends as its 500.
const appThrowing = (error: Error, handler: ErrorRequestHandler) => {
  const app = express();

  app.get('/berries', () => {
    throw error;
  });

  app.use(handler);
  app.use(apiErrorHandler);
  return app;
};

describe('domainErrorHandler', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['invalid', 400],
    ['not_found', 404],
    ['forbidden', 403],
    ['conflict', 409],
  ] as const)('should answer %s with %i and the message by default', async (code, status) => {
    // Given
    const app = appThrowing(new BerryError(code, 'Not this berry'), domainErrorHandler(BerryError));

    // When
    const response = await request(app).get('/berries');

    // Then
    expect(response.status).toBe(status);
    expect(response.body).toEqual({ error: 'Not this berry' });
  });

  it('should answer a code without a default with the status from the table', async () => {
    // Given
    const handler = domainErrorHandler(TrainerError, { taken: 409 });
    const app = appThrowing(new TrainerError('taken', 'Ash is taken'), handler);

    // When
    const response = await request(app).get('/berries');

    // Then
    expect(response.status).toBe(409);
  });

  it('should let the table override a default', async () => {
    // Given
    const handler = domainErrorHandler(BerryError, { invalid: 422 });
    const app = appThrowing(new BerryError('invalid', 'Not ripe'), handler);

    // When
    const response = await request(app).get('/berries');

    // Then
    expect(response.status).toBe(422);
  });

  it('should require a table naming every code without a default', () => {
    // When / Then
    // @ts-expect-error TrainerError has 'taken', which has no default status.
    expect(domainErrorHandler(TrainerError)).toBeTypeOf('function');
    // @ts-expect-error The table must name 'taken'.
    expect(domainErrorHandler(TrainerError, { invalid: 400 })).toBeTypeOf('function');
  });

  it('should pass on an error of another class with the same code', async () => {
    // Given
    const app = appThrowing(new PotionError('Too fizzy'), domainErrorHandler(BerryError));

    // When
    const response = await request(app).get('/berries');

    // Then
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal error' });
  });

  it('should pass on an unexpected error', async () => {
    // Given
    const app = appThrowing(new Error('database exploded'), domainErrorHandler(BerryError));

    // When
    const response = await request(app).get('/berries');

    // Then
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal error' });
  });
});
