import path from 'node:path';
import { moduleTestApp } from '#platform/backend/testing';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const MODULE_DIR = path.resolve(import.meta.dirname, '../../..');
const PLANTS = '/api/m/plant-assistant/plants';

const FERN = {
  name: "Bulbasaur's fern",
  description: null,
  tags: [],
  summerIntervalDays: 7,
  winterIntervalDays: 30,
  lastWateredOn: '2026-06-01',
};

const FERN_CHANGES = {
  name: "Bulbasaur's fern",
  description: null,
  tags: [],
  summerIntervalDays: 7,
  winterIntervalDays: 30,
  nextWateringOn: '2026-06-10',
};

const PREVIOUS = { lastWateredOn: '2026-06-01', nextWateringOn: '2026-06-08' };

const signedInApp = async () => {
  const { app, storage, signIn } = await moduleTestApp(MODULE_DIR, { today: () => '2026-06-08' });

  const sender =
    (cookie: string) =>
    (url: string, body?: unknown, method: 'post' | 'put' = 'post') =>
      request(app)
        [method](url)
        .set('Cookie', cookie)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(body ?? {}));

  const send = sender(await signIn('Misty'));

  const createFern = async () =>
    ((await send(PLANTS, FERN)).body as { plant: { id: number } }).plant.id;

  const plantOf = async (id: number) =>
    (
      await request(app)
        .get(`${PLANTS}/${String(id)}`)
        .set('Cookie', await signIn('Misty'))
    ).body as { plant: { lastWateredOn: string; nextWateringOn: string } };

  return {
    app,
    storage,
    signIn,
    sender,
    send,
    createFern,
    plantOf,
  };
};

describe('watering routes', () => {
  it('should keep the waterings behind the login', async () => {
    // Given
    const { app } = await signedInApp();

    // When
    const response = await request(app)
      .post(`${PLANTS}/1/waterings`)
      .set('Content-Type', 'application/json')
      .send('{}');

    // Then
    expect(response.status).toBe(401);
  });

  describe('POST /plants/:id/waterings', () => {
    it('should water a due plant and answer the dates before', async () => {
      // Given
      const { send, createFern, plantOf } = await signedInApp();
      const id = await createFern();

      // When
      const response = await send(`${PLANTS}/${String(id)}/waterings`);

      // Then
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ wateringId: 1, previous: PREVIOUS });

      expect((await plantOf(id)).plant).toMatchObject({
        lastWateredOn: '2026-06-08',
        nextWateringOn: '2026-06-15',
      });
    });

    it('should record the signed-in account', async () => {
      // Given
      const { storage, signIn, sender, createFern } = await signedInApp();
      const id = await createFern();
      const brock = sender(await signIn('Brock'));

      // When
      await brock(`${PLANTS}/${String(id)}/waterings`);

      // Then
      expect(
        storage.prepare('SELECT account_id, username FROM plant_assistant_waterings').all(),
      ).toEqual([{ account_id: 2, username: 'Brock' }]);
    });

    it('should answer 409 when another user watered the plant first', async () => {
      // Given
      const { send, signIn, sender, createFern } = await signedInApp();
      const id = await createFern();
      const brock = sender(await signIn('Brock'));
      await send(`${PLANTS}/${String(id)}/waterings`);

      // When
      const response = await brock(`${PLANTS}/${String(id)}/waterings`);

      // Then
      expect(response.status).toBe(409);
      expect(response.body).toEqual({ error: `Plant ${String(id)} is not due` });
    });

    it.each([`${PLANTS}/42/waterings`, `${PLANTS}/fern/waterings`])(
      'should answer 404 to %s',
      async (url) => {
        // Given
        const { send } = await signedInApp();

        // When
        const response = await send(url);

        // Then
        expect(response.status).toBe(404);
      },
    );
  });

  describe('POST /plants/:id/waterings/:wateringId/undo', () => {
    it('should undo the watering', async () => {
      // Given
      const { send, createFern, plantOf } = await signedInApp();
      const id = await createFern();
      await send(`${PLANTS}/${String(id)}/waterings`);

      // When
      const response = await send(`${PLANTS}/${String(id)}/waterings/1/undo`, {
        previous: PREVIOUS,
      });

      // Then
      expect(response.status).toBe(204);
      expect((await plantOf(id)).plant).toMatchObject(PREVIOUS);
    });

    it('should answer 409 when the plant changed since', async () => {
      // Given
      const { send, createFern } = await signedInApp();
      const id = await createFern();
      await send(`${PLANTS}/${String(id)}/waterings`);
      await send(`${PLANTS}/${String(id)}`, FERN_CHANGES, 'put');

      // When
      const response = await send(`${PLANTS}/${String(id)}/waterings/1/undo`, {
        previous: PREVIOUS,
      });

      // Then
      expect(response.status).toBe(409);
    });

    it.each([
      ['no previous dates', {}],
      ['a malformed date', { previous: { ...PREVIOUS, lastWateredOn: '2026-6-1' } }],
      ['impossible dates', { previous: { ...PREVIOUS, lastWateredOn: '2026-06-08' } }],
    ])('should answer 400 to %s', async (_case, body) => {
      // Given
      const { send, createFern } = await signedInApp();
      const id = await createFern();
      await send(`${PLANTS}/${String(id)}/waterings`);

      // When
      const response = await send(`${PLANTS}/${String(id)}/waterings/1/undo`, body);

      // Then
      expect(response.status).toBe(400);
    });

    it.each([`${PLANTS}/1/waterings/2/undo`, `${PLANTS}/1/waterings/rain/undo`])(
      'should answer 404 to %s',
      async (url) => {
        // Given
        const { send, createFern } = await signedInApp();
        await createFern();
        await send(`${PLANTS}/1/waterings`);

        // When
        const response = await send(url, { previous: PREVIOUS });

        // Then
        expect(response.status).toBe(404);
      },
    );
  });

  describe('POST /plants/:id/postpone', () => {
    it('should postpone a due plant', async () => {
      // Given
      const { send, createFern, plantOf } = await signedInApp();
      const id = await createFern();

      // When
      const response = await send(`${PLANTS}/${String(id)}/postpone`, { days: 3 });

      // Then
      expect(response.status).toBe(204);
      expect((await plantOf(id)).plant.nextWateringOn).toBe('2026-06-11');
    });

    it('should answer 409 when the plant is not due', async () => {
      // Given
      const { send, createFern } = await signedInApp();
      const id = await createFern();
      await send(`${PLANTS}/${String(id)}/postpone`, { days: 3 });

      // When
      const response = await send(`${PLANTS}/${String(id)}/postpone`, { days: 3 });

      // Then
      expect(response.status).toBe(409);
    });

    it.each([{}, { days: '3' }, { days: 0 }, { days: 31 }])(
      'should answer 400 to %j',
      async (body) => {
        // Given
        const { send, createFern } = await signedInApp();
        const id = await createFern();

        // When
        const response = await send(`${PLANTS}/${String(id)}/postpone`, body);

        // Then
        expect(response.status).toBe(400);
      },
    );

    it('should answer 404 to an unknown plant', async () => {
      // Given
      const { send } = await signedInApp();

      // When
      const response = await send(`${PLANTS}/42/postpone`, { days: 3 });

      // Then
      expect(response.status).toBe(404);
    });
  });
});
