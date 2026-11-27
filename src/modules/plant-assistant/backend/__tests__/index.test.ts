import path from 'node:path';
import { moduleTestApp } from '#platform/backend/testing';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const MODULE_DIR = path.resolve(import.meta.dirname, '../..');
const PLANTS = '/api/m/plant-assistant/plants';

const plant = (name: string, lastWateredOn: string) => ({
  name,
  description: null,
  tags: [],
  summerIntervalDays: 7,
  winterIntervalDays: 30,
  lastWateredOn,
});

const startOn = async (day: string) => {
  let today = day;
  const { app, signIn } = await moduleTestApp(MODULE_DIR, { today: () => today });
  const cookie = await signIn('Misty');

  const post = (url: string, body: unknown = {}) =>
    request(app)
      .post(url)
      .set('Cookie', cookie)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(body));

  const createPlant = async (name: string, lastWateredOn: string): Promise<number> =>
    ((await post(PLANTS, plant(name, lastWateredOn))).body as { plant: { id: number } }).plant.id;

  const countOnBadge = async (): Promise<number | undefined> =>
    (
      (await request(app).get('/api/tiles').set('Cookie', cookie)).body as {
        tiles: { moduleId: string | null; countOnBadge: number }[];
      }
    ).tiles.find(({ moduleId }) => moduleId === 'plant-assistant')?.countOnBadge;

  const moveTo = (next: string) => {
    today = next;
  };

  return {
    post,
    createPlant,
    countOnBadge,
    moveTo,
  };
};

describe('plant assistant registration', () => {
  it('should show the number of plants due today on the home tile', async () => {
    // Given
    const { createPlant, countOnBadge } = await startOn('2026-06-08');
    await createPlant("Bulbasaur's fern", '2026-06-01');
    await createPlant("Oddish's ivy", '2026-05-20');
    await createPlant("Cacnea's cactus", '2026-06-05');

    // When / Then
    expect(await countOnBadge()).toBe(2);
  });

  it('should lower the count when a plant is watered or postponed', async () => {
    // Given
    const { post, createPlant, countOnBadge } = await startOn('2026-06-08');
    const fern = await createPlant("Bulbasaur's fern", '2026-06-01');
    const ivy = await createPlant("Oddish's ivy", '2026-05-20');

    // When
    await post(`${PLANTS}/${String(fern)}/waterings`);
    const afterWatering = await countOnBadge();
    await post(`${PLANTS}/${String(ivy)}/postpone`, { days: 2 });
    const afterPostponing = await countOnBadge();

    // Then
    expect([afterWatering, afterPostponing]).toEqual([1, 0]);
  });

  it('should count a plant again when its next watering comes', async () => {
    // Given
    const { createPlant, countOnBadge, moveTo } = await startOn('2026-06-03');
    await createPlant("Bulbasaur's fern", '2026-06-01');
    const before = await countOnBadge();

    // When
    moveTo('2026-06-08');

    // Then
    expect([before, await countOnBadge()]).toEqual([0, 1]);
  });
});
