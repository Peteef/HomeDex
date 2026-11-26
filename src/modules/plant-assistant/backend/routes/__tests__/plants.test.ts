import path from 'node:path';
import { moduleTestApp } from '#platform/backend/testing';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const MODULE_DIR = path.resolve(import.meta.dirname, '../../..');
const PLANTS = '/api/m/plant-assistant/plants';

const FERN = {
  name: "Bulbasaur's fern",
  description: 'Likes shade',
  tags: ['Salon'],
  summerIntervalDays: 7,
  winterIntervalDays: 30,
  lastWateredOn: '2026-06-01',
};

const FERN_CHANGES = {
  name: "Bulbasaur's fern",
  description: 'Likes shade',
  tags: ['Salon'],
  summerIntervalDays: 7,
  winterIntervalDays: 30,
  nextWateringOn: '2026-06-08',
};

const signedInApp = async () => {
  let today = '2026-06-03';
  const { app, signIn } = await moduleTestApp(MODULE_DIR, { today: () => today });
  const misty = await signIn('Misty');

  const send = (method: 'get' | 'post' | 'put' | 'delete', url: string, body?: unknown) =>
    request(app)
      [method](url)
      .set('Cookie', misty)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(body ?? {}));

  const create = async (plant: unknown = FERN) =>
    (await send('post', PLANTS, plant)).body as { plant: { id: number } };

  const moveTo = (day: string) => {
    today = day;
  };

  return {
    app,
    send,
    create,
    moveTo,
  };
};

describe('plants routes', () => {
  it('should keep the plants behind the login', async () => {
    // Given
    const { app } = await signedInApp();

    // When
    const response = await request(app).get(PLANTS);

    // Then
    expect(response.status).toBe(401);
  });

  it('should create a plant and answer it with its schedule', async () => {
    // Given
    const { send } = await signedInApp();

    // When
    const response = await send('post', PLANTS, FERN);

    // Then
    expect(response.status).toBe(201);

    expect(response.body).toEqual({
      plant: {
        id: 1,
        name: "Bulbasaur's fern",
        description: 'Likes shade',
        tags: ['Salon'],
        photoId: null,
        lastWateredOn: '2026-06-01',
        nextWateringOn: '2026-06-08',
        daysUntil: 5,
        urgency: 'later',
        summerIntervalDays: 7,
        winterIntervalDays: 30,
        currentSeason: 'summer',
      },
    });
  });

  it('should list the plants with today', async () => {
    // Given
    const { send, create } = await signedInApp();
    await create();

    // When
    const response = await send('get', PLANTS);

    // Then
    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      today: '2026-06-03',
      plants: [{ id: 1, name: "Bulbasaur's fern", daysUntil: 5, urgency: 'later' }],
    });
  });

  it('should show a plant as overdue once today moves past its watering', async () => {
    // Given
    const { send, create, moveTo } = await signedInApp();
    await create();

    // When
    moveTo('2026-06-10');
    const response = await send('get', PLANTS);

    // Then
    expect(response.body).toMatchObject({
      today: '2026-06-10',
      plants: [{ daysUntil: -2, urgency: 'overdue' }],
    });
  });

  it('should give one plant with today', async () => {
    // Given
    const { send, create } = await signedInApp();
    const { plant } = await create();

    // When
    const response = await send('get', `${PLANTS}/${String(plant.id)}`);

    // Then
    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      today: '2026-06-03',
      plant: { id: plant.id, currentSeason: 'summer' },
    });
  });

  it('should edit a plant', async () => {
    // Given
    const { send, create } = await signedInApp();
    const { plant } = await create();

    // When
    const response = await send('put', `${PLANTS}/${String(plant.id)}`, {
      ...FERN_CHANGES,
      name: 'Oddish',
      nextWateringOn: '2026-06-20',
    });

    // Then
    expect(response.status).toBe(204);

    expect((await send('get', `${PLANTS}/${String(plant.id)}`)).body).toMatchObject({
      plant: { name: 'Oddish', nextWateringOn: '2026-06-20' },
    });
  });

  it('should delete a plant', async () => {
    // Given
    const { send, create } = await signedInApp();
    const { plant } = await create();

    // When
    const response = await send('delete', `${PLANTS}/${String(plant.id)}`);

    // Then
    expect(response.status).toBe(204);
    expect((await send('get', `${PLANTS}/${String(plant.id)}`)).status).toBe(404);
  });

  it('should reject a body of the wrong shape', async () => {
    // Given
    const { send } = await signedInApp();

    // When
    const response = await send('post', PLANTS, { ...FERN, summerIntervalDays: '7' });

    // Then
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid plant' });
  });

  it('should reject a date that is not a calendar date', async () => {
    // Given
    const { send } = await signedInApp();

    // When
    const response = await send('post', PLANTS, { ...FERN, lastWateredOn: '2026-02-30' });

    // Then
    expect(response.status).toBe(400);
  });

  it('should reject a field outside its limits', async () => {
    // Given
    const { send } = await signedInApp();

    // When
    const response = await send('post', PLANTS, { ...FERN, name: ' ' });

    // Then
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'The name is empty' });
  });

  it('should reject a last watering in the future', async () => {
    // Given
    const { send } = await signedInApp();

    // When
    const response = await send('post', PLANTS, { ...FERN, lastWateredOn: '2026-06-04' });

    // Then
    expect(response.status).toBe(400);
  });

  it('should reject a changed next watering in the past', async () => {
    // Given
    const { send, create } = await signedInApp();
    const { plant } = await create();

    // When
    const response = await send('put', `${PLANTS}/${String(plant.id)}`, {
      ...FERN_CHANGES,
      nextWateringOn: '2026-06-02',
    });

    // Then
    expect(response.status).toBe(400);
  });

  it('should answer 204 to deleting a plant that is already gone', async () => {
    // Given
    const { send, create } = await signedInApp();
    const { plant } = await create();
    await send('delete', `${PLANTS}/${String(plant.id)}`);

    // When
    const response = await send('delete', `${PLANTS}/${String(plant.id)}`);

    // Then
    expect(response.status).toBe(204);
  });

  it.each([
    ['get', `${PLANTS}/42`],
    ['put', `${PLANTS}/42`],
    ['get', `${PLANTS}/fern`],
  ] as const)('should answer 404 to %s %s', async (method, url) => {
    // Given
    const { send } = await signedInApp();

    // When
    const response = await send(method, url, FERN_CHANGES);

    // Then
    expect(response.status).toBe(404);
  });

  describe('photos', () => {
    const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x01]);
    const OTHER_JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x02]);
    const photoOf = (id: number) => `${PLANTS}/${String(id)}/photo`;

    it('should create a plant with a photo and serve it with long private caching', async () => {
      // Given
      const { send, create } = await signedInApp();

      // When
      const { plant } = await create({ ...FERN, photo: JPEG.toString('base64') });
      const response = await send('get', photoOf(plant.id));

      // Then
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/jpeg');
      expect(response.headers['cache-control']).toBe('private, max-age=31536000, immutable');
      expect(Buffer.from(response.body as Buffer)).toEqual(JPEG);
    });

    it('should keep the photo when an edit leaves it out, and replace it with a new one', async () => {
      // Given
      const { send, create } = await signedInApp();
      const { plant } = await create({ ...FERN, photo: JPEG.toString('base64') });

      const firstPhotoId = (
        (await send('get', `${PLANTS}/${String(plant.id)}`)).body as {
          plant: { photoId: number };
        }
      ).plant.photoId;

      // When
      await send('put', `${PLANTS}/${String(plant.id)}`, FERN_CHANGES);

      // Then
      expect(Buffer.from((await send('get', photoOf(plant.id))).body as Buffer)).toEqual(JPEG);

      // When
      await send('put', `${PLANTS}/${String(plant.id)}`, {
        ...FERN_CHANGES,
        photo: OTHER_JPEG.toString('base64'),
      });

      // Then
      const changed = await send('get', `${PLANTS}/${String(plant.id)}`);
      expect((changed.body as { plant: { photoId: number } }).plant.photoId).not.toBe(firstPhotoId);

      expect(Buffer.from((await send('get', photoOf(plant.id))).body as Buffer)).toEqual(
        OTHER_JPEG,
      );
    });

    it('should remove the photo when an edit sends null', async () => {
      // Given
      const { send, create } = await signedInApp();
      const { plant } = await create({ ...FERN, photo: JPEG.toString('base64') });

      // When
      await send('put', `${PLANTS}/${String(plant.id)}`, { ...FERN_CHANGES, photo: null });

      // Then
      expect((await send('get', photoOf(plant.id))).status).toBe(404);
    });

    it('should answer 404 for a plant without a photo', async () => {
      // Given
      const { send, create } = await signedInApp();
      const { plant } = await create();

      // When / Then
      expect((await send('get', photoOf(plant.id))).status).toBe(404);
    });

    it('should take a body large enough for a photo of 700 kB', async () => {
      // Given
      const { send } = await signedInApp();
      const photo = Buffer.concat([JPEG, Buffer.alloc(700 * 1024)]).toString('base64');

      // When
      const response = await send('post', PLANTS, { ...FERN, photo });

      // Then
      expect(response.status).toBe(201);
    });

    it('should reject a photo that is not a JPEG', async () => {
      // Given
      const { send } = await signedInApp();

      // When
      const response = await send('post', PLANTS, {
        ...FERN,
        photo: Buffer.from('not a jpeg').toString('base64'),
      });

      // Then
      expect(response.status).toBe(400);
    });

    it('should keep the photo behind the login', async () => {
      // Given
      const { app, create } = await signedInApp();
      const { plant } = await create({ ...FERN, photo: JPEG.toString('base64') });

      // When
      const response = await request(app).get(photoOf(plant.id));

      // Then
      expect(response.status).toBe(401);
    });
  });
});
