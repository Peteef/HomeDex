import path from 'node:path';
import { moduleTestApp } from '#platform/backend/testing';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const MODULE_DIR = path.resolve(import.meta.dirname, '../../..');
const CALENDAR = '/api/m/plant-assistant/calendar';

const signedInApp = async () => {
  const { app, signIn } = await moduleTestApp(MODULE_DIR, { today: () => '2026-06-03' });
  const misty = await signIn('Misty');

  const get = (url: string) => request(app).get(url).set('Cookie', misty);

  return {
    app,
    get,
  };
};

describe('calendar routes', () => {
  it('should keep the calendar behind the login', async () => {
    // Given
    const { app } = await signedInApp();

    // When
    const response = await request(app).get(CALENDAR);

    // Then
    expect(response.status).toBe(401);
  });

  it('should answer the current month without a month given', async () => {
    // Given
    const { get } = await signedInApp();

    // When
    const response = await get(CALENDAR);

    // Then
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ today: '2026-06-03', month: '2026-06' });

    expect((response.body as { weeks: { date: string }[][] }).weeks[0]?.[0]).toMatchObject({
      date: '2026-06-01',
    });
  });

  it.each(['2026-06', '2027-06'])('should answer the month %s', async (month) => {
    // Given
    const { get } = await signedInApp();

    // When
    const response = await get(`${CALENDAR}?month=${month}`);

    // Then
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ month });
  });

  it.each(['month=2026-05', 'month=2027-07', 'month=june', 'month=2026-06&month=2026-07'])(
    'should answer 400 to %s',
    async (query) => {
      // Given
      const { get } = await signedInApp();

      // When
      const response = await get(`${CALENDAR}?${query}`);

      // Then
      expect(response.status).toBe(400);
    },
  );
});
