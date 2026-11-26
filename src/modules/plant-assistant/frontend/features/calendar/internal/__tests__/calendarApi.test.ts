import { fakeApi, ok } from '#platform/frontend/testing';
import { describe, expect, it } from 'vitest';
import { fetchCalendarMonth } from '../calendarApi.ts';

const NOVEMBER = { today: '2026-11-20', month: '2026-11', weeks: [] };

describe('calendar API', () => {
  it("should fetch today's month when no month is given", async () => {
    // Given
    fakeApi({ 'GET /api/m/plant-assistant/calendar': ok(NOVEMBER) });

    // When / Then
    expect(await fetchCalendarMonth(null)).toEqual(NOVEMBER);
  });

  it('should fetch the given month', async () => {
    // Given
    const december = { ...NOVEMBER, month: '2026-12' };
    fakeApi({ 'GET /api/m/plant-assistant/calendar?month=2026-12': ok(december) });

    // When / Then
    expect(await fetchCalendarMonth('2026-12')).toEqual(december);
  });
});
