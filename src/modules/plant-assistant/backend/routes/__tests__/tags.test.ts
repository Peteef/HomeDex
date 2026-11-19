import path from 'node:path';
import { moduleTestApp } from '#platform/backend/testing';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const MODULE_DIR = path.resolve(import.meta.dirname, '../../..');
const PLANTS = '/api/m/plant-assistant/plants';
const TAGS = '/api/m/plant-assistant/tags';

const plantTagged = (tags: string[]) => ({
  name: "Bulbasaur's fern",
  description: null,
  tags,
  summerIntervalDays: 7,
  winterIntervalDays: 30,
  lastWateredOn: '2026-06-01',
});

describe('tags routes', () => {
  it('should list every tag in use once', async () => {
    // Given
    const { app, signIn } = await moduleTestApp(MODULE_DIR, { today: () => '2026-06-03' });
    const misty = await signIn('Misty');

    const create = (tags: string[]) =>
      request(app)
        .post(PLANTS)
        .set('Cookie', misty)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(plantTagged(tags)));

    await create(['Salon', 'Shade']);
    await create(['salon', 'Balcony']);

    // When
    const response = await request(app).get(TAGS).set('Cookie', misty);

    // Then
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ tags: ['Balcony', 'Salon', 'Shade'] });
  });

  it('should keep the tags behind the login', async () => {
    // Given
    const { app } = await moduleTestApp(MODULE_DIR);

    // When
    const response = await request(app).get(TAGS);

    // Then
    expect(response.status).toBe(401);
  });
});
