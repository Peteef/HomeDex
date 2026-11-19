import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { jsonBody } from '../jsonBody.ts';

const appWith = (parser: express.RequestHandler): express.Express => {
  const app = express();
  app.use(parser);

  app.post('/echo', (req, res) => {
    res.json(req.body);
  });

  return app;
};

const postText = (app: express.Express, length: number) =>
  request(app)
    .post('/echo')
    .set('Content-Type', 'application/json')
    .send(JSON.stringify({ text: 'x'.repeat(length) }));

describe('jsonBody', () => {
  it('should parse a body up to 100 kB when no limit is given', async () => {
    // When
    const response = await postText(appWith(jsonBody()), 90_000);

    // Then
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ text: 'x'.repeat(90_000) });
  });

  it('should refuse a body over 100 kB when no limit is given', async () => {
    // When
    const response = await postText(appWith(jsonBody()), 110_000);

    // Then
    expect(response.status).toBe(413);
  });

  it('should parse a body up to the limit when a limit is given', async () => {
    // When
    const response = await postText(appWith(jsonBody(200)), 190_000);

    // Then
    expect(response.status).toBe(200);
  });

  it('should refuse a body over the limit when a limit is given', async () => {
    // When
    const response = await postText(appWith(jsonBody(200)), 210_000);

    // Then
    expect(response.status).toBe(413);
  });
});
