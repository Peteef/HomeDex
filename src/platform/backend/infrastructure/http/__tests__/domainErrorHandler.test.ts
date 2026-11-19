import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { domainErrorHandler } from '../domainErrorHandler.ts';
import { apiErrorHandler } from '../errorHandler.ts';

type BerryErrorCode = 'invalid' | 'not_found';

class BerryError extends Error {
  readonly code: BerryErrorCode;

  constructor(code: BerryErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

class PotionError extends Error {
  readonly code = 'invalid';
}

// The app's own error handler follows, so an error passed on ends as its 500.
const appThrowing = (error: Error) => {
  const app = express();

  app.get('/berries', () => {
    throw error;
  });

  app.use(domainErrorHandler(BerryError, { invalid: 400, not_found: 404 }));
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

  it('should answer an error of its class with the status of its code and its message', async () => {
    // Given
    const app = appThrowing(new BerryError('not_found', 'No berry with id 7'));

    // When
    const response = await request(app).get('/berries');

    // Then
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'No berry with id 7' });
  });

  it('should pass on an error of another class with the same code', async () => {
    // Given
    const app = appThrowing(new PotionError('Too fizzy'));

    // When
    const response = await request(app).get('/berries');

    // Then
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal error' });
  });

  it('should pass on an unexpected error', async () => {
    // Given
    const app = appThrowing(new Error('database exploded'));

    // When
    const response = await request(app).get('/berries');

    // Then
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal error' });
  });
});
