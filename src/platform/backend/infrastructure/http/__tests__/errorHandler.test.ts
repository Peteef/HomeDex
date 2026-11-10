import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiErrorHandler } from '../errorHandler.ts';

describe('apiErrorHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should answer 500 with a generic JSON body and log the error when a route fails unexpectedly', async () => {
    // Given
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const app = express();
    app.get('/boom', () => {
      throw new Error('database exploded');
    });
    app.use(apiErrorHandler);

    // When
    const response = await request(app).get('/boom');

    // Then
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal error' });
    expect(JSON.stringify(response.body)).not.toContain('database exploded');
    expect(logged).toHaveBeenCalled();
  });

  it('should answer 400 with a JSON body when the request body is malformed', async () => {
    // Given
    const app = express();
    app.use(express.json());
    app.post('/echo', (_req, res) => {
      res.end();
    });
    app.use(apiErrorHandler);

    // When
    const response = await request(app)
      .post('/echo')
      .set('Content-Type', 'application/json')
      .send('{broken');

    // Then
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid request body' });
  });

  it('should pass the error on to Express when the response has already started', () => {
    // Given
    const error = new Error('too late');
    const next = vi.fn() as unknown as NextFunction;
    const res = { headersSent: true } as Response;

    // When
    apiErrorHandler(error, {} as Request, res, next);

    // Then
    expect(next).toHaveBeenCalledWith(error);
  });
});
